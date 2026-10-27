import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { createAdminIssueListHandler, createMyOrderIssuesHandler, createOrderIssueHandler, createResolveOrderIssueHandler } from './orderIssues.js';

const id='00000000-0000-4000-8000-000000000001';
function issueEndpoint(actor:{id:string;role:string},orderStatus='work_submitted'){
 const calls:Array<{sql:string;values?:unknown[]}>=[];
 const client={query:vi.fn(async(sql:string,values?:unknown[])=>{calls.push({sql,values});
  if(sql.startsWith('SELECT * FROM orders'))return {rows:[{id,checkout_batch_id:'batch',status:orderStatus,buyer_id:'buyer',seller_id:'seller'}],rowCount:1};
  if(sql.startsWith('SELECT * FROM checkout_payments'))return {rows:[{id:'payment',status:'simulated',method:'me_wallet'}],rowCount:1};
  if(sql.startsWith('INSERT INTO order_issues'))return {rows:[{id:'issue'}],rowCount:1};return {rows:[],rowCount:1};}),release:vi.fn()};
 const db={connect:vi.fn(async()=>client)} as unknown as Pick<Pool,'connect'>,app=express();app.use(express.json());app.post('/orders/:id/issues',(req,res,next)=>{res.locals.user=actor;next();},(req,res,next)=>{void createOrderIssueHandler(db)(req,res).catch(next);});app.use((e:any,_req:unknown,res:express.Response,_next:unknown)=>res.status(e.status||500).json({error:e.message}));return {app,calls};
}
function resolveEndpoint(options:{issueType:string;pre?:string;admin?:string;method?:string;decision:string;status?:string;conflicting?:boolean;paymentAmount?:string}){
 const calls:Array<{sql:string;values?:unknown[]}>=[];
 const issue={id:'issue',order_id:id,issue_type:options.issueType,claimant_id:options.issueType==='refund_request'?'buyer':'seller',reason:'Please review the submitted work',pre_dispute_status:options.pre||'work_submitted'};
 const client={query:vi.fn(async(sql:string,values?:unknown[])=>{calls.push({sql,values});
  if(sql.startsWith('SELECT order_id FROM order_issues'))return {rows:[{order_id:id}],rowCount:1};
  if(sql.startsWith('SELECT * FROM orders'))return {rows:[{id,checkout_batch_id:'batch',status:options.status||'under_dispute',buyer_id:'buyer',seller_id:options.admin==='buyer'?'admin':'seller',price_snapshot:'100000'}],rowCount:1};
  if(sql.startsWith('SELECT * FROM order_issues'))return {rows:options.conflicting?[issue,{...issue,id:'issue2',issue_type:'payment_claim',claimant_id:'seller'}]:[issue],rowCount:options.conflicting?2:1};
  if(sql.startsWith('SELECT id,service_id,price_snapshot FROM orders'))return {rows:[{id,service_id:'service',price_snapshot:'100000'}],rowCount:1};
  if(sql.startsWith('SELECT * FROM checkout_payments'))return {rows:[{id:'payment',method:options.method||'me_wallet',status:'simulated',amount:options.paymentAmount||'100000'}],rowCount:1};return {rows:[],rowCount:1};}),release:vi.fn()};
 const db={connect:vi.fn(async()=>client)} as unknown as Pick<Pool,'connect'>,app=express();app.use(express.json());app.post('/issues/:id',(req,res,next)=>{res.locals.user={id:options.admin||'admin',role:'admin'};next();},(req,res,next)=>{void createResolveOrderIssueHandler(db)(req,res).catch(next);});app.use((e:any,_req:unknown,res:express.Response,_next:unknown)=>res.status(e.status||500).json({error:e.message}));return {app,calls};
}

describe('order complaints and Admin adjudication',()=>{
 it.each(['buyer','seller','admin'])('accepts a refund complaint from the actual buyer even when their role is %s',async role=>{const t=issueEndpoint({id:'buyer',role});const r=await request(t.app).post(`/orders/${id}/issues`).send({issueType:'refund_request',reason:'The delivered work does not match the brief'});expect(r.status).toBe(201);expect(t.calls.find(c=>c.sql.startsWith('INSERT INTO order_issues'))?.values).toEqual([id,'refund_request','buyer','The delivered work does not match the brief','work_submitted']);});
 it.each(['seller','admin'])('accepts a payment complaint from the actual seller regardless of role %s',async role=>{const t=issueEndpoint({id:'seller',role});const r=await request(t.app).post(`/orders/${id}/issues`).send({issueType:'payment_claim',reason:'The payment for submitted work is missing'});expect(r.status).toBe(201);});
 it.each(['pending','paid','accepted','in_progress','completed','cancelled','rejected','resolved','refunded'])('rejects a complaint at %s',async status=>{const t=issueEndpoint({id:'buyer',role:'buyer'},status);const r=await request(t.app).post(`/orders/${id}/issues`).send({issueType:'refund_request',reason:'I need an Admin to review this order'});expect(r.status).toBe(409);expect(t.calls.some(c=>c.sql.startsWith('INSERT INTO order_issues'))).toBe(false);});
 it('rejects another user’s issue and rejects seller claims from the buyer',async()=>{const t=issueEndpoint({id:'stranger',role:'buyer'});expect((await request(t.app).post(`/orders/${id}/issues`).send({issueType:'refund_request',reason:'Please inspect the delivered work'})).status).toBe(403);});
 it('rejects an unrelated Admin seller complaint',async()=>{const t=issueEndpoint({id:'admin',role:'admin'});expect((await request(t.app).post(`/orders/${id}/issues`).send({issueType:'payment_claim',reason:'Please inspect this unrelated order'})).status).toBe(403);});
 it('refunds Me-Wallet once and sets refunded',async()=>{const t=resolveEndpoint({issueType:'refund_request',decision:'approve_refund'});const r=await request(t.app).post('/issues/issue').send({decision:'approve_refund'});expect(r.status).toBe(200);expect(r.body.status).toBe('refunded');expect(t.calls.some(c=>c.sql.startsWith('INSERT INTO order_settlements'))).toBe(true);expect(t.calls.some(c=>c.sql.startsWith('INSERT INTO wallet_transactions')&&c.values?.[0]==='buyer')).toBe(true);});
 it('refunds historical orders at their recorded principal when no checkout tax was charged',async()=>{const t=resolveEndpoint({issueType:'refund_request',decision:'approve_refund',paymentAmount:'100000'});await request(t.app).post('/issues/issue').send({decision:'approve_refund'});expect(t.calls.find(c=>c.sql.startsWith('INSERT INTO order_settlements'))?.values?.[2]).toBe('100000');});
 it('includes the 10 percent checkout tax only when the recorded payment contains it',async()=>{const t=resolveEndpoint({issueType:'refund_request',decision:'approve_refund',paymentAmount:'110000'});await request(t.app).post('/issues/issue').send({decision:'approve_refund'});expect(t.calls.find(c=>c.sql.startsWith('INSERT INTO order_settlements'))?.values?.[2]).toBe('110000');});
 it('approves seller payment as resolved, not completed',async()=>{const t=resolveEndpoint({issueType:'payment_claim',decision:'approve_payment'});const r=await request(t.app).post('/issues/issue').send({decision:'approve_payment'});expect(r.status).toBe(200);expect(r.body.status).toBe('resolved');expect(t.calls.some(c=>c.sql.startsWith('INSERT INTO wallet_transactions')&&c.values?.[0]==='seller')).toBe(true);});
 it('rejects a complaint and restores the saved state',async()=>{const t=resolveEndpoint({issueType:'refund_request',pre:'work_submitted',decision:'reject'});const r=await request(t.app).post('/issues/issue').send({decision:'reject'});expect(r.status).toBe(200);expect(r.body.status).toBe('work_submitted');expect(t.calls.some(c=>c.sql.startsWith('UPDATE order_settlements'))).toBe(false);});
 it('prevents an Admin from resolving their own order',async()=>{const t=resolveEndpoint({issueType:'refund_request',decision:'approve_refund',admin:'buyer'});const r=await request(t.app).post('/issues/issue').send({decision:'approve_refund'});expect(r.status).toBe(403);expect(t.calls.some(c=>c.sql.startsWith('INSERT INTO order_settlements'))).toBe(false);});
 it('supports an explicit buyer or seller outcome when both parties have open complaints',async()=>{const seller=resolveEndpoint({issueType:'refund_request',decision:'approve_seller',conflicting:true});const r=await request(seller.app).post('/issues/issue').send({decision:'approve_seller'});expect(r.status).toBe(200);expect(r.body.status).toBe('resolved');const buyer=resolveEndpoint({issueType:'refund_request',decision:'approve_buyer',conflicting:true});const b=await request(buyer.app).post('/issues/issue').send({decision:'approve_buyer'});expect(b.status).toBe(200);expect(b.body.status).toBe('refunded');});
});

describe('Admin dispute queue',()=>{
 it('does not show an admin their own buyer or seller disputes as resolvable',async()=>{
  let sql='',parameters:unknown[]|undefined;
  const db={query:vi.fn(async(query:string,values?:unknown[])=>{sql=query;parameters=values;return {rows:[],rowCount:0};})} as unknown as Pick<Pool,'query'>;
  const app=express();app.get('/admin/issues',(req,res,next)=>{res.locals.user={id:'admin',role:'admin'};next();},(req,res,next)=>{void createAdminIssueListHandler(db)(req,res).catch(next);});
  await request(app).get('/admin/issues');
  expect(sql).toContain('o.buyer_id<>$1 AND o.seller_id<>$1');
  expect(parameters).toEqual(['admin']);
 });
});

describe('order decision visibility',()=>{
 it('returns a recorded admin decision, timestamp, reason, and limited admin identity to related parties',async()=>{
  let sql='';
  const issue={resolution:'approve_refund',resolved_at:'2026-01-01T00:00:00Z',decision_reason:'The submitted work did not match the brief.',decision_admin_name:'Reviewer',decision_admin_avatar:'/media/reviewer.png'};
  const db={query:vi.fn(async(query:string)=>{sql=query;return {rows:[issue],rowCount:1};})} as unknown as Pick<Pool,'query'>;
  const app=express();app.get('/mine',(req,res,next)=>{res.locals.user={id:'buyer'};next();},(req,res,next)=>{void createMyOrderIssuesHandler(db)(req,res).catch(next);});
  const response=await request(app).get('/mine');
  expect(response.body.issues[0]).toEqual(issue);
  expect(sql).toContain('LEFT JOIN users resolver ON resolver.id=i.resolved_by AND resolver.role=\'admin\'');
  expect(sql).toContain('decision.reason decision_reason');
 });
});
