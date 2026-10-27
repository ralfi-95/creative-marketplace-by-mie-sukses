import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { allocateCheckoutTax } from './pricing.js';

const issueBody=z.object({issueType:z.enum(['refund_request','payment_claim']),reason:z.string().trim().min(5).max(2000)});
const resolutionBody=z.object({decision:z.enum(['approve_payment','approve_refund','approve_seller','approve_buyer','reject']),reason:z.string().trim().min(5).max(2000).optional()});

export function createOrderIssueHandler(db:Pick<Pool,'connect'>){return async(req:Request,res:Response)=>{
 const body=issueBody.parse(req.body),user=res.locals.user as {id:string;role:string},client=await db.connect();
 try{
  await client.query('BEGIN');
  const row=await client.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[req.params.id]);
  if(!row.rowCount)throw Object.assign(new Error('Order not found.'),{status:404});
  const order=row.rows[0],buyerIssue=body.issueType==='refund_request';
  if((buyerIssue&&user.id!==order.buyer_id)||(!buyerIssue&&user.id!==order.seller_id))throw Object.assign(new Error('You cannot open this issue.'),{status:403});
  if(order.status!=='work_submitted')throw Object.assign(new Error('A complaint can only be filed after work is submitted.'),{status:409});
  const pay=await client.query("SELECT * FROM checkout_payments WHERE checkout_batch_id=$1 AND status='simulated' FOR UPDATE",[order.checkout_batch_id]);
  if(!pay.rowCount)throw Object.assign(new Error('A confirmed simulated payment is required.'),{status:409});
  const issue=await client.query('INSERT INTO order_issues(order_id,issue_type,claimant_id,reason,pre_dispute_status) VALUES($1,$2,$3,$4,$5) RETURNING *',[order.id,body.issueType,user.id,body.reason,order.status]);
  await client.query("UPDATE orders SET status='under_dispute',updated_at=now() WHERE id=$1",[order.id]);
  await client.query("INSERT INTO order_events(order_id,actor_id,from_status,to_status,reason) VALUES($1,$2,$3,'under_dispute',$4)",[order.id,user.id,order.status,body.reason]);
  await client.query('COMMIT');res.status(201).json({issue:issue.rows[0]});
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
};}

export function createAdminIssueListHandler(db:Pick<Pool,'query'>){return async(req:Request,res:Response)=>{
 const admin=(res.locals.user as {id:string}).id;
 const result=await db.query("SELECT i.*,o.status order_status,o.title_snapshot,o.price_snapshot,o.seller_name_snapshot,o.checkout_batch_id,o.buyer_id,o.seller_id,buyer.display_name buyer_name,seller.display_name seller_name,claimant.display_name claimant_name,claimant.role claimant_role,p.method payment_method,p.provider,p.status payment_status,s.description service_description,coalesce((SELECT jsonb_agg(jsonb_build_object('delivery_url',d.delivery_url,'media_path',d.media_path,'message',d.message,'created_at',d.created_at) ORDER BY d.created_at) FROM order_deliverables d WHERE d.order_id=o.id),'[]'::jsonb) deliverables FROM order_issues i JOIN orders o ON o.id=i.order_id JOIN users buyer ON buyer.id=o.buyer_id JOIN users seller ON seller.id=o.seller_id JOIN users claimant ON claimant.id=i.claimant_id LEFT JOIN services s ON s.id=o.service_id LEFT JOIN checkout_payments p ON p.checkout_batch_id=o.checkout_batch_id WHERE i.status='open' AND o.status='under_dispute' AND o.buyer_id<>$1 AND o.seller_id<>$1 ORDER BY i.created_at",[admin]);
 res.json({issues:result.rows});
};}

export function createMyOrderIssuesHandler(db:Pick<Pool,'query'>){return async(_req:Request,res:Response)=>{const user=res.locals.user as {id:string};const result=await db.query("SELECT i.id,i.order_id,i.issue_type,i.reason,i.status,i.created_at,i.resolution,i.resolved_at,i.resolved_by,o.title_snapshot,o.price_snapshot,o.status order_status,resolver.display_name decision_admin_name,CASE WHEN resolver.role='admin' THEN resolver.avatar_path END decision_admin_avatar,decision.reason decision_reason FROM order_issues i JOIN orders o ON o.id=i.order_id LEFT JOIN users resolver ON resolver.id=i.resolved_by AND resolver.role='admin' LEFT JOIN LATERAL(SELECT e.reason FROM order_events e WHERE e.order_id=i.order_id AND e.actor_id=i.resolved_by AND e.created_at>=i.resolved_at ORDER BY e.created_at DESC LIMIT 1) decision ON true WHERE i.claimant_id=$1 OR o.buyer_id=$1 OR o.seller_id=$1 ORDER BY i.created_at DESC LIMIT 100",[user.id]);res.json({issues:result.rows});};}

export function createResolveOrderIssueHandler(db:Pick<Pool,'connect'>){return async(req:Request,res:Response)=>{
 const body=resolutionBody.parse(req.body),admin=(res.locals.user as {id:string}).id,client=await db.connect();
 try{
  await client.query('BEGIN');
  const reference=await client.query('SELECT order_id FROM order_issues WHERE id=$1',[req.params.id]);
  if(!reference.rowCount)throw Object.assign(new Error('Issue is unavailable.'),{status:404});
  const orders=await client.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[reference.rows[0].order_id]);
  if(!orders.rowCount||orders.rows[0].status!=='under_dispute')throw Object.assign(new Error('Order is no longer under dispute.'),{status:409});
  const order=orders.rows[0];
  if(order.buyer_id===admin||order.seller_id===admin)throw Object.assign(new Error('An Admin cannot resolve an issue on their own order.'),{status:403});
  const issues=await client.query("SELECT * FROM order_issues WHERE order_id=$1 AND status='open' ORDER BY created_at FOR UPDATE",[order.id]);
  if(!issues.rowCount)throw Object.assign(new Error('Issue is already resolved.'),{status:409});
  const types=new Set(issues.rows.map((issue:{issue_type:string})=>issue.issue_type));
  const hasBuyer=types.has('refund_request')||types.has('customer_cancellation')||types.has('seller_rejection');
  const hasSeller=types.has('payment_claim');
  const conflicting=hasBuyer&&hasSeller;
  let sellerOutcome=body.decision==='approve_payment'||body.decision==='approve_seller';
  let refundOutcome=body.decision==='approve_refund'||body.decision==='approve_buyer';
  if(body.decision==='reject')sellerOutcome=refundOutcome=false;
  else if(conflicting){
   if(!['approve_seller','approve_buyer'].includes(body.decision))throw Object.assign(new Error('Choose which party’s outcome to approve.'),{status:400});
   sellerOutcome=body.decision==='approve_seller';refundOutcome=body.decision==='approve_buyer';
  }else if(hasSeller&&!hasBuyer&&!['approve_payment','approve_seller','reject'].includes(body.decision))throw Object.assign(new Error('This issue requires a seller-payment decision.'),{status:400});
  else if(hasBuyer&&!hasSeller&&!['approve_refund','approve_buyer','reject'].includes(body.decision))throw Object.assign(new Error('This issue requires a buyer-refund decision.'),{status:400});
  else if(!hasBuyer&&!hasSeller)throw Object.assign(new Error('This issue type cannot be resolved through this workflow.'),{status:409});

  let paymentMethod:string|null=null,refundAmount=String(order.price_snapshot),batchPrices:(string|number)[]=[],taxShares=0n,orderTaxShare=0n;
  if(refundOutcome){
   const batchOrders=await client.query('SELECT id,service_id,price_snapshot FROM orders WHERE checkout_batch_id=$1 ORDER BY service_id,id',[order.checkout_batch_id]);
   batchPrices=batchOrders.rows.map((entry:{price_snapshot:string|number})=>entry.price_snapshot);
   const shares=allocateCheckoutTax(batchPrices);
   const orderIndex=batchOrders.rows.findIndex((entry:{id:string})=>entry.id===order.id);
   if(orderIndex<0)throw Object.assign(new Error('Order pricing snapshot is unavailable.'),{status:409});
   taxShares=shares.reduce((sum,share)=>sum+share,0n);
   orderTaxShare=shares[orderIndex];
  }
  if(sellerOutcome||refundOutcome){
   const result=await client.query("SELECT * FROM checkout_payments WHERE checkout_batch_id=$1 AND status='simulated' FOR UPDATE",[order.checkout_batch_id]);
   if(!result.rowCount)throw Object.assign(new Error('A tracked simulated payment is required for settlement.'),{status:409});
   const payment=result.rows[0] as {id:string;method:string;provider:string|null;amount:string|number};
   paymentMethod=payment.method;
   if(refundOutcome){
    const batchSubtotal=batchPrices.reduce((sum,price)=>sum+BigInt(price),0n);
    const taxCollected=BigInt(payment.amount)-batchSubtotal;
    refundAmount=(BigInt(order.price_snapshot)+(taxCollected===taxShares?orderTaxShare:0n)).toString();
   }
   if(sellerOutcome){
    await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[order.seller_id]);
    await client.query("INSERT INTO order_settlements(order_id,outcome,checkout_payment_id,amount,method,provider,recorded_by) VALUES($1,'payment',$2,$3,$4,$5,$6)",[order.id,payment.id,order.price_snapshot,payment.method,payment.provider,admin]);
    await client.query("INSERT INTO wallet_transactions(user_id,entry_type,amount,method,provider,order_id,checkout_batch_id) VALUES($1,'order_earning',$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING",[order.seller_id,order.price_snapshot,payment.method,payment.provider,order.id,order.checkout_batch_id]);
    await client.query("INSERT INTO wallet_ledger(seller_id,order_id,entry_type,amount) VALUES($1,$2,'order_earning',$3) ON CONFLICT(order_id,entry_type) DO NOTHING",[order.seller_id,order.id,order.price_snapshot]);
   }else{
    await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[order.buyer_id]);
    await client.query("INSERT INTO order_settlements(order_id,outcome,checkout_payment_id,amount,method,provider,recorded_by) VALUES($1,'refund',$2,$3,$4,$5,$6)",[order.id,payment.id,refundAmount,payment.method,payment.provider,admin]);
    if(payment.method==='me_wallet')await client.query("INSERT INTO wallet_transactions(user_id,entry_type,amount,method,order_id,checkout_batch_id) VALUES($1,'refund',$2,'me_wallet',$3,$4) ON CONFLICT DO NOTHING",[order.buyer_id,refundAmount,order.id,order.checkout_batch_id]);
   }
  }

  const prior=issues.rows[0].pre_dispute_status||'work_submitted';
  const next=sellerOutcome?'resolved':refundOutcome?'refunded':prior;
  const resolution=sellerOutcome?(conflicting?'approve_seller':'approve_payment'):refundOutcome?(conflicting?'approve_buyer':'approve_refund'):'rejected';
  await client.query('UPDATE orders SET status=$1,updated_at=now() WHERE id=$2',[next,order.id]);
  await client.query("UPDATE order_issues SET status='resolved',resolution=$1,resolved_by=$2,resolved_at=now() WHERE order_id=$3 AND status='open'",[resolution,admin,order.id]);
  await client.query('INSERT INTO order_events(order_id,actor_id,from_status,to_status,reason) VALUES($1,$2,\'under_dispute\',$3,$4)',[order.id,admin,next,body.reason||null]);
  await client.query("INSERT INTO audit_events(actor_id,action,target_type,target_id,details) VALUES($1,$2,'order_issue',$3,$4)",[admin,resolution,req.params.id,JSON.stringify({orderId:order.id,amount:refundOutcome?refundAmount:sellerOutcome?order.price_snapshot:null,method:paymentMethod,reason:body.reason||null})]);
  await client.query('COMMIT');res.json({ok:true,status:next,resolution,reason:body.reason||null});
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
};}
