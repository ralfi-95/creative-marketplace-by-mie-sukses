import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { createPublicSellerHandler, createServiceListHandler } from './catalog.js';

const sellerId='00000000-0000-4000-8000-000000000001';

describe('review and completed-order aggregates',()=>{
 it('returns independent service ratings and completed-order counts from completed orders only',async()=>{
  let sql='';
  const services=[
   {id:'service-a',rating:'4.00',review_count:1,completed_order_count:3},
   {id:'service-b',rating:null,review_count:0,completed_order_count:2},
  ];
  const db={query:vi.fn(async(query:string)=>{sql=query;return {rows:services,rowCount:services.length};})} as unknown as Pick<Pool,'query'>;
  const app=express();app.get('/services',(req,res,next)=>{void createServiceListHandler(db)(req,res).catch(next);});
  const response=await request(app).get('/services');
  expect(response.body.services).toEqual(services);
  expect(sql).toContain('WHERE o.service_id=s.id AND o.status=\'completed\'');
  expect(sql).toContain('avg(r.rating)');
  expect(sql).toContain('count(o.id)::int completed_order_count');
 });

 it('returns seller-wide average and counts across owned services without exposing buyer data',async()=>{
  const queries:string[]=[];
  const db={query:vi.fn(async(query:string)=>{queries.push(query);return query.startsWith('SELECT u.id')?{rows:[{id:sellerId,display_name:'Seller',rating:'3.50',review_count:2,completed_order_count:5}],rowCount:1}:{rows:[{id:'service-a',rating:'4.00',review_count:1,completed_order_count:3},{id:'service-b',rating:'3.00',review_count:1,completed_order_count:2}],rowCount:2};})} as unknown as Pick<Pool,'query'>;
  const app=express();app.get('/sellers/:id',(req,res,next)=>{void createPublicSellerHandler(db)(req,res).catch(next);});
  const response=await request(app).get(`/sellers/${sellerId}`);
  expect(response.body.seller).toMatchObject({rating:'3.50',review_count:2,completed_order_count:5});
  expect(response.body.services.map((service:any)=>service.rating)).toEqual(['4.00','3.00']);
  expect(queries[0]).toContain('owned.seller_id=u.id AND o.status=\'completed\'');
  expect(queries[0]).not.toContain('buyer_phone');expect(queries[0]).not.toContain('buyer_email');
  expect(response.body.seller).not.toHaveProperty('contact_phone');
 });
});
