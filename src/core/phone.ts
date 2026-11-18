export const VENEZUELA_DIALLING_CODE = '+58';

const VENEZUELA_COUNTRY_CODE = '58';
const VENEZUELA_COUNTRY_CODE_PATTERN = new RegExp(
  `^0*${VENEZUELA_COUNTRY_CODE}`,
);
const VENEZUELAN_MOBILE_PATTERN = /^4\d{9}$/;
const MAX_NATIONAL_DIGITS = 10;
const MAX_DISPLAY_DIGITS = MAX_NATIONAL_DIGITS + 1;

function stripCountryCode(input: string): string {
  return input.replace(/\D/g, '').replace(VENEZUELA_COUNTRY_CODE_PATTERN, '');
}

/**
 * Prepares user input for display. Keeps a single national leading zero and
 * drops the dialling code, which is implicit for this field.
 */
export function sanitizeVenezuelanPhoneInput(input: string): string {
  const digits = stripCountryCode(input).replace(/^0+(?=\d)/, '0');
  const limit = digits.startsWith('0')
    ? MAX_DISPLAY_DIGITS
    : MAX_NATIONAL_DIGITS;

  return digits.slice(0, limit);
}

/**
 * Extracts the national significant number used for validation and delivery.
 * Removes the dialling code and every leading zero.
 */
export function normalizeVenezuelanPhone(input: string): string {
  return stripCountryCode(input).replace(/^0+/, '');
}

export function formatVenezuelanPhone(input: string): string {
  const digits = sanitizeVenezuelanPhoneInput(input);

  if (digits.startsWith('0')) {
    const national = digits.slice(1);

    if (national.length <= 3) {
      return digits;
    }

    return `${digits.slice(0, 4)} ${national.slice(3)}`;
  }

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
