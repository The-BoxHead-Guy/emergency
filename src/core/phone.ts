export const VENEZUELA_DIALLING_CODE = '+58';

const VENEZUELAN_MOBILE_PATTERN = /^4\d{9}$/;

export function normalizeVenezuelanPhone(input: string): string {
  return input.replace(/\D/g, '').replace(/^0+/, '');
}

export function formatVenezuelanPhone(input: string): string {
  const digits = normalizeVenezuelanPhone(input).slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }

  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
}

export function isValidVenezuelanPhone(input: string): boolean {
  return VENEZUELAN_MOBILE_PATTERN.test(normalizeVenezuelanPhone(input));
}

export function toVenezuelanE164(input: string): string | null {
  const digits = normalizeVenezuelanPhone(input);

  if (!VENEZUELAN_MOBILE_PATTERN.test(digits)) {
    return null;
  }

  return `${VENEZUELA_DIALLING_CODE}${digits}`;
}
