import { describe, expect, it } from 'vitest';
import { isValidPhone, normalizePhone } from './contactPhone.js';

describe('contact phone normalization', () => {
  it.each([
    ['0812 3456 7890', '+6281234567890'],
    ['812-3456-7890', '+6281234567890'],
    ['6281234567890', '+6281234567890'],
    ['+62 812-3456-7890', '+6281234567890'],
    ['+62 0812-3456-7890', '+6281234567890'],
    ['+1 202 555 0100', '+12025550100'],
  ])('normalizes %s', (input, expected) => expect(normalizePhone(input)).toBe(expected));
  it('rejects malformed and out-of-range values', () => {
    expect(isValidPhone('08123')).toBe(false);
    expect(isValidPhone('call me')).toBe(false);
  });
});
