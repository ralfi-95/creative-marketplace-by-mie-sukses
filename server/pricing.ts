export function checkoutTax(subtotal: bigint): bigint {
  if (subtotal < 0n) throw new Error('Subtotal cannot be negative.');
  return (subtotal + 5n) / 10n;
}

export function checkoutTotals(prices: (number | string | bigint)[]) {
  const subtotal = prices.reduce<bigint>((sum, price) => sum + BigInt(price), 0n);
  const tax = checkoutTax(subtotal);
  return { subtotal: subtotal.toString(), tax: tax.toString(), total: (subtotal + tax).toString() };
}

export function allocateCheckoutTax(prices: (number | string | bigint)[]): bigint[] {
  let cumulative = 0n, allocated = 0n;
  return prices.map(price => {
    cumulative += BigInt(price);
    const next = checkoutTax(cumulative);
    const share = next - allocated;
    allocated = next;
    return share;
  });
}
