import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { DEMO_PAYMENT_PIN } from './paymentSimulation.js';

const confirmation=z.object({demoPin:z.string().length(6).optional()});

export function createPaymentConfirmationHandler(db:Pick<Pool,'connect'>){
 return async(req:Request,res:Response)=>{
  const body=confirmation.parse(req.body||{}),user=res.locals.user as {id:string},client=await db.connect();
  try{
   await client.query('BEGIN');
   const orders=await client.query('SELECT id,status FROM orders WHERE checkout_batch_id=$1 AND buyer_id=$2 ORDER BY id FOR UPDATE',[req.params.batchId,user.id]);
   if(!orders.rowCount)throw Object.assign(new Error('Checkout batch not found.'),{status:404});
   const payment=await client.query('SELECT * FROM checkout_payments WHERE checkout_batch_id=$1 AND buyer_id=$2 FOR UPDATE',[req.params.batchId,user.id]);
   if(!payment.rowCount)throw Object.assign(new Error('Payment record not found.'),{status:404});
   if(payment.rows[0].status==='simulated'){
    await client.query('COMMIT');
    return res.json({ok:true,status:'simulated',replayed:true});
   }
   if(payment.rows[0].status!=='awaiting_payment'||orders.rows.some((order:{status:string})=>order.status!=='pending'))throw Object.assign(new Error('This payment can no longer be confirmed.'),{status:409});
   if(['bank_transfer','e_wallet'].includes(payment.rows[0].method)&&body.demoPin!==DEMO_PAYMENT_PIN)throw Object.assign(new Error('Enter the documented demo PIN 123456 to complete this simulation.'),{status:400});
   await client.query("UPDATE checkout_payments SET status='simulated',confirmed_at=now() WHERE id=$1 AND status='awaiting_payment'",[payment.rows[0].id]);
   await client.query("UPDATE orders SET status='paid',updated_at=now() WHERE checkout_batch_id=$1 AND status='pending'",[req.params.batchId]);
   await client.query("INSERT INTO order_events(order_id,actor_id,from_status,to_status,reason) SELECT id,$2,'pending','paid','Simulated payment confirmed' FROM orders WHERE checkout_batch_id=$1",[req.params.batchId,user.id]);
   await client.query("INSERT INTO audit_events(actor_id,action,target_type,target_id,details) VALUES($1,'payment_simulated','checkout_batch',$2,$3)",[user.id,req.params.batchId,JSON.stringify({method:payment.rows[0].method,provider:payment.rows[0].provider,amount:payment.rows[0].amount})]);
   await client.query('COMMIT');
   res.json({ok:true,status:'simulated',replayed:false});
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
 };
}
