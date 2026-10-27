import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { createAdminTransactionHistoryHandler } from './adminTransactions.js';

describe('administrative transaction ledger display',()=>{
 it('retains signed ledger direction, includes payout entries, and avoids duplicate wallet checkout debits',async()=>{
  let sql='';
  const db={query:vi.fn(async(query:string)=>{sql=query;return {rows:[{transaction_type:'payout_reserved',amount:'-50000',status:'pending',linked_orders:[{id:'order-1',status:'cancelled'}]}],rowCount:1};})} as unknown as Pick<Pool,'query'>;
  const app=express();app.get('/transactions',(req,res,next)=>{void createAdminTransactionHistoryHandler(db)(req,res).catch(next);});
  const response=await request(app).get('/transactions');
  expect(response.body.transactions[0]).toMatchObject({transaction_type:'payout_reserved',amount:'-50000',status:'pending'});
  expect(sql).toContain('w.amount::text amount');
  expect(sql).toContain('l.amount::text');
  expect(sql).toContain("l.entry_type<>'order_earning'");
  expect(sql).toContain("w.entry_type='order_payment'");
  expect(sql).toContain('(-abs(p.amount))::text');
  expect(sql).toContain("json_build_object('id',o.id,'status',o.status)");
  expect(response.body.transactions[0].linked_orders).toEqual([{id:'order-1',status:'cancelled'}]);
 });
});
