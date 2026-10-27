import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { createPaymentConfirmationHandler } from './payment.js';

const batchId='00000000-0000-4000-8000-000000000001';

function endpoint(initialPayment='awaiting_payment',orderStatus='pending',method='qris'){
 let paymentStatus=initialPayment,audits=0;
 const calls:string[]=[];
 const client={query:vi.fn(async(sql:string)=>{
  calls.push(sql);
  if(sql.startsWith('SELECT id,status FROM orders'))return {rows:[{id:'order',status:orderStatus}],rowCount:1};
  if(sql.startsWith('SELECT * FROM checkout_payments'))return {rows:[{id:'payment',status:paymentStatus,method,provider:'BCA',amount:'50000'}],rowCount:1};
  if(sql.startsWith('UPDATE checkout_payments'))paymentStatus='simulated';
  if(sql.startsWith('INSERT INTO audit_events'))audits++;
  return {rows:[],rowCount:1};
 }),release:vi.fn()};
 const db={connect:vi.fn(async()=>client)} as unknown as Pick<Pool,'connect'>;
 const app=express();
 app.use(express.json());
 app.post('/checkout/:batchId/payment/confirm',(req,res,next)=>{res.locals.user={id:'buyer'};next();},(req,res,next)=>{void createPaymentConfirmationHandler(db)(req,res).catch(next);});
 app.use((error:any,_req:unknown,res:express.Response,_next:unknown)=>res.status(error.status||500).json({error:error.message}));
 return {app,calls,get audits(){return audits;}};
}

describe('checkout payment simulation',()=>{
 it('requires explicit confirmation and makes retries idempotent',async()=>{
  const test=endpoint();
  const first=await request(test.app).post(`/checkout/${batchId}/payment/confirm`);
  const second=await request(test.app).post(`/checkout/${batchId}/payment/confirm`);
  expect(first.body).toMatchObject({ok:true,status:'simulated',replayed:false});
  expect(second.body).toMatchObject({ok:true,status:'simulated',replayed:true});
  expect(test.audits).toBe(1);
  expect(test.calls.filter(sql=>sql.startsWith('UPDATE checkout_payments'))).toHaveLength(1);
 });

 it('does not confirm payment after an order leaves pending',async()=>{
  const test=endpoint('awaiting_payment','accepted');
  const response=await request(test.app).post(`/checkout/${batchId}/payment/confirm`);
  expect(response.status).toBe(409);
  expect(test.audits).toBe(0);
  expect(test.calls.at(-1)).toBe('ROLLBACK');
 });

 it('requires the fixed documented demo PIN for e-wallet simulation',async()=>{
  const test=endpoint('awaiting_payment','pending','e_wallet');
  const invalid=await request(test.app).post(`/checkout/${batchId}/payment/confirm`).send({demoPin:'000000'});
  expect(invalid.status).toBe(400);
  expect(test.audits).toBe(0);
  const valid=await request(test.app).post(`/checkout/${batchId}/payment/confirm`).send({demoPin:'123456'});
  expect(valid.status).toBe(200);
  expect(test.calls.some(sql=>sql.startsWith('UPDATE orders SET status=\'paid\''))).toBe(true);
 });

 it('requires the fixed demo PIN for bank-transfer simulation',async()=>{
  const test=endpoint('awaiting_payment','pending','bank_transfer');
  expect((await request(test.app).post(`/checkout/${batchId}/payment/confirm`).send({demoPin:'000000'})).status).toBe(400);
  const valid=await request(test.app).post(`/checkout/${batchId}/payment/confirm`).send({demoPin:'123456'});
  expect(valid.status).toBe(200);
 });
});
