import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { createDeliverableHandler } from './deliverables.js';

const orderId='00000000-0000-4000-8000-000000000001';

function endpoint(status:string,seller='seller',mediaAvailable=true){
 const calls:string[]=[];
 const client={query:vi.fn(async(sql:string)=>{calls.push(sql);if(sql.startsWith('SELECT id,seller_id,status'))return {rows:[{id:orderId,seller_id:seller,status}],rowCount:1};if(sql.startsWith('SELECT 1 FROM media_uploads'))return {rows:[],rowCount:mediaAvailable?1:0};if(sql.startsWith('INSERT INTO order_deliverables'))return {rows:[{id:'delivery',message:'Files are ready'}],rowCount:1};return {rows:[],rowCount:1};}),release:vi.fn()};
 const db={connect:vi.fn(async()=>client)} as unknown as Pick<Pool,'connect'>;
 const app=express();app.use(express.json());
 app.post('/orders/:id/deliverables',(req,res,next)=>{res.locals.user={id:'seller'};next();},(req,res,next)=>{void createDeliverableHandler(db)(req,res).catch(next);});
 app.use((error:any,_req:unknown,res:express.Response,_next:unknown)=>res.status(error.status||500).json({error:error.message}));
 return {app,calls};
}

describe('seller deliverable submission',()=>{
 it('stores work for the assigned seller on an in-progress order transactionally',async()=>{
  const test=endpoint('in_progress');
  const response=await request(test.app).post(`/orders/${orderId}/deliverables`).send({deliveryUrl:'https://drive.google.com/file/example'});
  expect(response.status).toBe(201);
  expect(test.calls.map(sql=>sql.split(' ')[0])).toEqual(['BEGIN','SELECT','INSERT','UPDATE','INSERT','INSERT','COMMIT']);
 });
 it.each([['wrong seller','in_progress','someone-else',403],['not Processed','accepted','seller',409]])('rejects %s',async(_name,status,seller,expected)=>{
  const test=endpoint(status,seller);
  const response=await request(test.app).post(`/orders/${orderId}/deliverables`).send({deliveryUrl:'https://drive.google.com/file/example'});
  expect(response.status).toBe(expected);
  expect(test.calls.at(-1)).toBe('ROLLBACK');
 });
 it('rejects an attachment that was not uploaded by this seller for this order',async()=>{
  const test=endpoint('in_progress','seller',false);
  const response=await request(test.app).post(`/orders/${orderId}/deliverables`).send({message:'See attached',mediaPath:'/media/00000000-0000-4000-8000-000000000002.pdf'});
  expect(response.status).toBe(400);
  expect(test.calls.some(sql=>sql.startsWith('INSERT INTO order_deliverables'))).toBe(false);
 });
});
