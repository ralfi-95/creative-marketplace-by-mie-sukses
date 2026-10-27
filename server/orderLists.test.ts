import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { createBuyerOrderListHandler, createOrderDetailHandler, createSellerOrderListHandler } from './orderLists.js';

function endpoint(kind:'buyer'|'seller'){
 const query=vi.fn(async(sql:string,values:unknown[])=>({rows:[{id:'owned'}],rowCount:1}));
 const db={query} as unknown as Pick<Pool,'query'>,app=express();
 const handler=kind==='buyer'?createBuyerOrderListHandler(db):createSellerOrderListHandler(db);
 app.get('/orders',(req,res,next)=>{res.locals.user={id:'current-user',role:kind};next();},(req,res,next)=>{void handler(req,res).catch(next);});
 return {app,query};
}

describe('role-specific order lists',()=>{
 it('returns only orders placed by the buyer',async()=>{
  const test=endpoint('buyer'),response=await request(test.app).get('/orders');
  expect(response.status).toBe(200);
  expect(test.query.mock.calls[0][0]).toContain('WHERE o.buyer_id=$1');
  expect(test.query.mock.calls[0][1]).toEqual(['current-user']);
 });
 it('returns only orders assigned to the seller',async()=>{
  const test=endpoint('seller'),response=await request(test.app).get('/orders');
  expect(response.status).toBe(200);
  expect(test.query.mock.calls[0][0]).toContain('WHERE o.seller_id=$1');
  expect(test.query.mock.calls[0][1]).toEqual(['current-user']);
 });
});

describe('order detail contact privacy',()=>{
 async function detail(user:{id:string;role:string}){
  const query=vi.fn(async(sql:string,values:unknown[])=>{
   if(sql.startsWith('SELECT o.*')){
    const allowed=values[1]==='buyer'||values[1]==='seller'||values[2]===true;
    return {rows:allowed?[{id:'order',buyer_id:'buyer',seller_id:'seller',buyer_email_snapshot:'private@example.test',buyer_phone_snapshot:'+6281234567890'}]:[],rowCount:Number(allowed)};
   }
   return {rows:[],rowCount:0};
  });
  const app=express();app.get('/orders/:id',(req,res,next)=>{res.locals.user=user;next();},(req,res,next)=>{void createOrderDetailHandler({query} as unknown as Pick<Pool,'query'>)(req,res).catch(next);});
  return {response:await request(app).get('/orders/order'),query};
 }
 it('shows a seller only the contact phone for their own order, not the buyer email',async()=>{
  const {response}=await detail({id:'seller',role:'seller'});
  expect(response.body.order).toMatchObject({buyer_phone_snapshot:'+6281234567890',buyer_email_snapshot:null});
 });
 it('keeps buyer contact visible to that buyer and hides it from unrelated admins and users',async()=>{
  const buyer=await detail({id:'buyer',role:'admin'}),admin=await detail({id:'admin',role:'admin'}),stranger=await detail({id:'stranger',role:'buyer'});
  expect(buyer.response.body.order).toMatchObject({buyer_phone_snapshot:'+6281234567890',buyer_email_snapshot:'private@example.test'});
  expect(admin.response.body.order).toMatchObject({buyer_phone_snapshot:null,buyer_email_snapshot:null});
  expect(stranger.response.status).toBe(404);
 });
});
