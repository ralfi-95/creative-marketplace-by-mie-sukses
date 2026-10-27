import { describe, expect, it } from 'vitest';
import { allocateCheckoutTax, checkoutTax, checkoutTotals } from './pricing.js';

describe('authoritative checkout tax', () => {
  it('rounds 10 percent once to the nearest whole rupiah', () => {
    expect(checkoutTax(1n)).toBe(0n);
    expect(checkoutTax(5n)).toBe(1n);
    expect(checkoutTotals(['100000', '50500'])).toEqual({ subtotal: '150500', tax: '15050', total: '165550' });
  });
  it('allocates the aggregate tax across orders without losing or creating rupiah', () => {
    const shares = allocateCheckoutTax(['105', '105', '105']);
    expect(shares.map(String)).toEqual(['11', '10', '11']);
    expect(shares.reduce((sum, share) => sum + share, 0n)).toBe(checkoutTax(315n));
  });
});
