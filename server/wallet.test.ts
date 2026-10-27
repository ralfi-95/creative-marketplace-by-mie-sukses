import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { createPayoutRequestHandler, createPayoutReviewHandler } from './wallet.js';

const key='00000000-0000-4000-8000-000000000001',payoutId='00000000-0000-4000-8000-000000000002';

function requestEndpoint(balance='10000'){
 let saved:any=null;const calls:string[]=[];
 const client={query:vi.fn(async(sql:string,values:any[]=[])=>{calls.push(sql);if(sql.startsWith('SELECT id FROM users'))return {rows:[{id:'seller'}],rowCount:1};if(sql.startsWith('SELECT * FROM wallet_payout_requests'))return {rows:saved?[saved]:[],rowCount:saved?1:0};if(sql.startsWith('SELECT coalesce(sum(amount)'))return {rows:[{amount:balance}],rowCount:1};if(sql.startsWith('INSERT INTO wallet_payout_requests')){saved={id:payoutId,seller_id:'seller',amount:values[2],status:'pending'};return {rows:[saved],rowCount:1};}return {rows:[],rowCount:1};}),release:vi.fn()};
 const db={connect:vi.fn(async()=>client)} as unknown as Pick<Pool,'connect'>,app=express();app.use(express.json());
 app.post('/payouts',(req,res,next)=>{res.locals.user={id:'seller'};next();},(req,res,next)=>{void createPayoutRequestHandler(db)(req,res).catch(next);});
 app.use((e:any,_req:unknown,res:express.Response,_next:unknown)=>res.status(e.status||500).json({error:e.message}));
 return {app,calls,client};
}

function reviewEndpoint(){
 let status='pending';const calls:string[]=[];
 const client={query:vi.fn(async(sql:string)=>{calls.push(sql);if(sql.startsWith('SELECT * FROM wallet_payout_requests'))return {rows:status==='pending'?[{id:payoutId,seller_id:'seller',amount:'3000'}]:[],rowCount:status==='pending'?1:0};if(sql.startsWith('UPDATE wallet_payout_requests'))status='rejected';return {rows:[],rowCount:1};}),release:vi.fn()};
 const db={connect:vi.fn(async()=>client)} as unknown as Pick<Pool,'connect'>,app=express();app.use(express.json());
 app.post('/payouts/:id/review',(req,res,next)=>{res.locals.user={id:'admin'};next();},(req,res,next)=>{void createPayoutReviewHandler(db)(req,res).catch(next);});
 app.use((e:any,_req:unknown,res:express.Response,_next:unknown)=>res.status(e.status||500).json({error:e.message}));
 return {app,calls};
}

describe('seller payout ledger',()=>{
 it('reserves available funds once and returns the original request on retry',async()=>{
  const test=requestEndpoint();
  const first=await request(test.app).post('/payouts').send({idempotencyKey:key,amount:5000});
  const replay=await request(test.app).post('/payouts').send({idempotencyKey:key,amount:5000});
  expect(first.status).toBe(201);
  expect(replay.body.replayed).toBe(true);
  expect(test.calls.filter(sql=>sql.startsWith('INSERT INTO wallet_payout_requests'))).toHaveLength(1);
  expect(test.calls.filter(sql=>sql.startsWith('INSERT INTO wallet_ledger'))).toHaveLength(1);
 });

 it('rejects requests above available balance',async()=>{
  const test=requestEndpoint('1000');
  const response=await request(test.app).post('/payouts').send({idempotencyKey:key,amount:1001});
  expect(response.status).toBe(409);
  expect(test.calls.some(sql=>sql.startsWith('INSERT INTO wallet_payout_requests'))).toBe(false);
 });

 it('releases reserved balance exactly once when an admin rejects',async()=>{
  const test=reviewEndpoint();
  const first=await request(test.app).post(`/payouts/${payoutId}/review`).send({decision:'rejected',reason:'Details need correction'});
  const second=await request(test.app).post(`/payouts/${payoutId}/review`).send({decision:'rejected',reason:'Details need correction'});
  expect(first.status).toBe(200);
  expect(second.status).toBe(409);
  expect(test.calls.filter(sql=>sql.startsWith('INSERT INTO wallet_ledger'))).toHaveLength(1);
 });
});
