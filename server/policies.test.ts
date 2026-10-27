import { describe,it,expect } from 'vitest';
import { canTransitionOrder } from './policies.js';

describe('order-party lifecycle authorization',()=>{
 it('allows the recorded seller and buyer regardless of global role',()=>{
  expect(canTransitionOrder('paid','accepted','s','b','s')).toBe(true);
  expect(canTransitionOrder('paid','rejected','s','b','s')).toBe(true);
  expect(canTransitionOrder('accepted','in_progress','s','b','s')).toBe(true);
  expect(canTransitionOrder('work_submitted','completed','b','b','s')).toBe(true);
 });
 it('allows Freelancer and Admin buyers to complete their own orders',()=>{
  for(const role of ['seller','admin'])expect(canTransitionOrder('work_submitted','completed','b','b','s')).toBe(true);
 });
 it('rejects unrelated actors, skipped transitions, cancellation, and terminal rewrites',()=>{
  expect(canTransitionOrder('pending','accepted','s','b','s')).toBe(false);
  expect(canTransitionOrder('pending','in_progress','s','b','s')).toBe(false);
  expect(canTransitionOrder('paid','accepted','other','b','s')).toBe(false);
  expect(canTransitionOrder('work_submitted','completed','admin','b','s')).toBe(false);
  expect(canTransitionOrder('pending','cancelled','b','b','s')).toBe(false);
  expect(canTransitionOrder('completed','completed','b','b','s')).toBe(false);
 });
});
