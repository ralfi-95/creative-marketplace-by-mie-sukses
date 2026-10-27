import { describe, expect, it } from 'vitest';
import { canReadDeliverable, canUploadDeliverable, validMediaSignature } from './mediaPolicy.js';

describe('deliverable media policy',()=>{
 it('allows only the assigned seller to upload for in-progress orders',()=>{
  expect(canUploadDeliverable('seller','seller','seller','in_progress')).toBe(true);
  expect(canUploadDeliverable('seller','other','seller','in_progress')).toBe(false);
  expect(canUploadDeliverable('admin','admin','seller','in_progress')).toBe(false);
  expect(canUploadDeliverable('seller','seller','seller','accepted')).toBe(false);
 });
 it('allows file access only to its owner or an authorized order participant',()=>{
  expect(canReadDeliverable('seller','seller',false)).toBe(true);
  expect(canReadDeliverable('buyer','seller',true)).toBe(true);
  expect(canReadDeliverable('stranger','seller',false)).toBe(false);
 });
 it('accepts supported signatures and rejects a MIME-only spoof',()=>{
  expect(validMediaSignature(Buffer.from([137,80,78,71,13,10,26,10]))).toBe(true);
  expect(validMediaSignature(Buffer.from([255,216,0,0,255,217]))).toBe(true);
  expect(validMediaSignature(Buffer.from('RIFF0000WEBP'))).toBe(true);
  expect(validMediaSignature(Buffer.from('%PDF-1.7'))).toBe(true);
  expect(validMediaSignature(Buffer.from('fake image'))).toBe(false);
 });
});
