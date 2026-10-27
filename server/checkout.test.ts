import { describe, expect, it } from 'vitest';
import { checkoutBodySchema, checkoutWalletBalance } from './checkout.js';

const valid={idempotencyKey:'00000000-0000-4000-8000-000000000001',email:'buyer@example.test',items:[{serviceId:'00000000-0000-4000-8000-000000000002',phone:'+62 812-3456-7890',projectBrief:'Please edit the product video for a 30 second launch.'}],paymentMethod:'bank_transfer',provider:'BCA'};

describe('checkout details',()=>{
 it('accepts valid buyer contact details and brief',()=>expect(checkoutBodySchema.safeParse(valid).success).toBe(true));
 it.each([
  {...valid,email:'not-an-email'},
  {...valid,items:[{...valid.items[0],phone:'123'}]},
  {...valid,items:[{...valid.items[0],projectBrief:'   '}]},
  {...valid,items:[{...valid.items[0],projectBrief:'x'.repeat(10001)}]},
  {...valid,provider:'unsupported-bank'},
  {...valid,paymentMethod:'bank_transfer',provider:undefined},
 ])('rejects invalid checkout details',input=>expect(checkoutBodySchema.safeParse(input).success).toBe(false));
 it('accepts an existing profile phone without another per-order number',()=>expect(checkoutBodySchema.safeParse({...valid,items:[{serviceId:valid.items[0].serviceId,projectBrief:valid.items[0].projectBrief}]}).success).toBe(true));
});

describe('Me-Wallet checkout balance',()=>{
 it('returns the resulting balance only when the atomic checkout is affordable',()=>{
  expect(checkoutWalletBalance('200000','150000')).toBe('50000');
  expect(()=>checkoutWalletBalance('149999','150000')).toThrowError(expect.objectContaining({status:409,code:'INSUFFICIENT_WALLET_BALANCE'}));
 });
});
