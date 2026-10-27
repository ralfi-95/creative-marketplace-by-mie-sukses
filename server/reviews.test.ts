import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { ZodError } from 'zod';
import { createOrderReviewHandler } from './reviews.js';

const orderId='00000000-0000-4000-8000-000000000001';
function endpoint(options:{buyer?:string;seller?:string;status?:string}={}){
 const order={id:orderId,buyer_id:options.buyer||'buyer',seller_id:options.seller||'seller',status:options.status||'completed'};
 let currentReview:{order_id:string;rating:number;created_at:string;updated_at:string}|null=null,locked=false,waiters:(()=>void)[]=[];
 const acquire=async()=>{if(locked)await new Promise<void>(resolve=>waiters.push(resolve));locked=true;};
 const release=()=>{locked=false;waiters.shift()?.();};
 const sql:string[]=[];
 const client={query:vi.fn(async(query:string,values:any[]=[]):Promise<any>=>{
  sql.push(query);
  if(query.startsWith('SELECT id,buyer_id,seller_id,status FROM orders')){await acquire();return {rows:[order],rowCount:1};}
  if(query.startsWith('INSERT INTO order_reviews')){
   const now=new Date().toISOString();
   currentReview={order_id:values[0],rating:values[1],created_at:currentReview?.created_at||now,updated_at:now};
   return {rows:[currentReview],rowCount:1};
  }
  if(query==='COMMIT'||query==='ROLLBACK')release();
  return {rows:[],rowCount:1};
 }),release:vi.fn()};
 const db={connect:vi.fn(async()=>client)} as unknown as Pick<Pool,'connect'>,app=express();app.use(express.json());
 app.put('/orders/:id/review',(req,res,next)=>{res.locals.user={id:req.get('x-user')||'buyer',role:req.get('x-role')||'buyer'};next();},(req,res,next)=>{void createOrderReviewHandler(db)(req,res).catch(next);});
 app.use((error:any,_req:unknown,res:express.Response,_next:unknown)=>res.status(error instanceof ZodError?400:error.status||500).json({error:error.message}));
 return {app,db,sql,get review(){return currentReview;}};
}

describe('completed order reviews',()=>{
 it('creates one buyer review and updates that record on replacement',async()=>{
  const t=endpoint();
  const first=await request(t.app).put(`/orders/${orderId}/review`).send({rating:4});
  const createdAt=t.review?.created_at;
  const updated=await request(t.app).put(`/orders/${orderId}/review`).send({rating:2});
  expect(first.status).toBe(200);expect(first.body.review.rating).toBe(4);
  expect(updated.body.review.rating).toBe(2);expect(updated.body.review.created_at).toBe(createdAt);
  expect(t.review).toMatchObject({order_id:orderId,rating:2});
  expect(t.sql.filter(query=>query.startsWith('INSERT INTO order_reviews'))).toHaveLength(2);
  expect(t.sql.some(query=>query.includes('ON CONFLICT(order_id) DO UPDATE'))).toBe(true);
 });

 it('allows a seller or admin who is the actual buyer, independent of global role',async()=>{
  for(const role of ['seller','admin']){
   const t=endpoint();
   const response=await request(t.app).put(`/orders/${orderId}/review`).set('x-role',role).send({rating:5});
   expect(response.status).toBe(200);
  }
 });

 it('rejects non-buyers and self-reviews',async()=>{
  const unrelated=endpoint(),notBuyer=await request(unrelated.app).put(`/orders/${orderId}/review`).set('x-user','stranger').send({rating:5});
  const own=endpoint({buyer:'seller',seller:'seller'}),self=await request(own.app).put(`/orders/${orderId}/review`).set('x-user','seller').send({rating:5});
  expect(notBuyer.status).toBe(403);expect(self.status).toBe(403);
  expect(unrelated.sql.some(query=>query.startsWith('INSERT INTO order_reviews'))).toBe(false);
 });

 it.each(['pending','paid','accepted','in_progress','work_submitted','under_dispute','resolved','rejected','cancelled','refunded'])('rejects non-completed order state %s',async status=>{
  const t=endpoint({status}),response=await request(t.app).put(`/orders/${orderId}/review`).send({rating:4});
  expect(response.status).toBe(409);expect(t.sql.some(query=>query.startsWith('INSERT INTO order_reviews'))).toBe(false);
 });

 it.each([0,6,1.5,'5'])('rejects invalid rating %s before opening a transaction',async rating=>{
  const t=endpoint(),response=await request(t.app).put(`/orders/${orderId}/review`).send({rating});
  expect(response.status).toBe(400);expect(t.db.connect).not.toHaveBeenCalled();
 });

 it('serializes concurrent writes and leaves one active review per order',async()=>{
  const t=endpoint();
  const [a,b]=await Promise.all([
   request(t.app).put(`/orders/${orderId}/review`).send({rating:3}),
   request(t.app).put(`/orders/${orderId}/review`).send({rating:5}),
  ]);
  expect(a.status).toBe(200);expect(b.status).toBe(200);expect(t.review?.rating).toBe(5);
  expect(t.sql.filter(query=>query.startsWith('INSERT INTO order_reviews'))).toHaveLength(2);
 });
});
