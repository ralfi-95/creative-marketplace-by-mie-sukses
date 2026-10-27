export function normalizePhone(value: string): string {
  const input = value.trim();
  if (!/^\+?[0-9 ()-]+$/.test(input)) throw new Error('Enter a valid phone number.');
  let digits = input.replace(/\D/g, '');
  if (!digits) throw new Error('Enter a valid phone number.');
  if (input.startsWith('+')) {
    if (digits.startsWith('620')) digits = `62${digits.slice(3)}`;
  } else if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  else if (!digits.startsWith('62')) digits = `62${digits}`;
  if (digits.startsWith('620')) digits = `62${digits.slice(3)}`;
  if (digits.length < 8 || digits.length > 15) throw new Error('Enter a phone number with 8 to 15 digits.');
  return `+${digits}`;
}

export function isValidPhone(value: string): boolean {
  try { normalizePhone(value); return true; } catch { return false; }
}
