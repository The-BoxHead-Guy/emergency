import { describe, expect, it } from 'vitest';
import {
  formatVenezuelanPhone,
  isValidVenezuelanPhone,
  normalizeVenezuelanPhone,
  sanitizeVenezuelanPhoneInput,
  toVenezuelanE164,
} from '@/core/phone';

describe('Venezuelan phone helpers', () => {
  it('normalizes a national mobile number without the leading zero', () => {
    expect(normalizeVenezuelanPhone('412 1301234')).toBe('4121301234');
  });

  it('strips the leading zero from the national format', () => {
    expect(normalizeVenezuelanPhone('0412 1301234')).toBe('4121301234');
  });

  it('removes non-digit characters', () => {
    expect(normalizeVenezuelanPhone('(0412) 130-1234')).toBe('4121301234');
  });

  it('strips a leading +58 dialling code', () => {
    expect(normalizeVenezuelanPhone('+58 412 1301234')).toBe('4121301234');
    expect(normalizeVenezuelanPhone('+584121301234')).toBe('4121301234');
  });

  it('strips a leading 58 dialling code', () => {
    expect(normalizeVenezuelanPhone('58 412 1301234')).toBe('4121301234');
    expect(normalizeVenezuelanPhone('584121301234')).toBe('4121301234');
  });

  it('strips an international prefix followed by the dialling code', () => {
    expect(normalizeVenezuelanPhone('0058 412 1301234')).toBe('4121301234');
    expect(normalizeVenezuelanPhone('+58 0412 1301234')).toBe('4121301234');
  });

  it('keeps a single national leading zero while typing for display', () => {
    expect(sanitizeVenezuelanPhoneInput('0412 1301234')).toBe('04121301234');
    expect(sanitizeVenezuelanPhoneInput('00412 1301234')).toBe('04121301234');
  });

  it('removes the dialling code while typing for display', () => {
    expect(sanitizeVenezuelanPhoneInput('+58 412 1301234')).toBe('4121301234');
    expect(sanitizeVenezuelanPhoneInput('58 412 1301234')).toBe('4121301234');
    expect(sanitizeVenezuelanPhoneInput('+58 0412 1301234')).toBe(
      '04121301234',
    );
  });

  it('caps the display input at the national length', () => {
    expect(sanitizeVenezuelanPhoneInput('41213012345')).toBe('4121301234');
    expect(sanitizeVenezuelanPhoneInput('041213012345')).toBe('04121301234');
  });

  it('formats a complete number as three digits plus seven digits', () => {
    expect(formatVenezuelanPhone('4121301234')).toBe('412 1301234');
  });

  it('formats a partial number as the user types', () => {
    expect(formatVenezuelanPhone('4121')).toBe('412 1');
    expect(formatVenezuelanPhone('412')).toBe('412');
  });

  it('keeps the leading zero visible when formatting', () => {
    expect(formatVenezuelanPhone('0412 1301234')).toBe('0412 1301234');
    expect(formatVenezuelanPhone('0412')).toBe('0412');
    expect(formatVenezuelanPhone('04121')).toBe('0412 1');
  });

  it('formats a number typed with the dialling code as a national number', () => {
    expect(formatVenezuelanPhone('+58 412 1301234')).toBe('412 1301234');
    expect(formatVenezuelanPhone('+58 0412 1301234')).toBe('0412 1301234');
  });

  it('accepts a full national mobile number', () => {
    expect(isValidVenezuelanPhone('412 1301234')).toBe(true);
    expect(isValidVenezuelanPhone('0412 1301234')).toBe(true);
  });

  it('accepts a full number typed with the dialling code', () => {
    expect(isValidVenezuelanPhone('+58 412 1301234')).toBe(true);
    expect(isValidVenezuelanPhone('58 412 1301234')).toBe(true);
  });

  it('rejects invalid prefixes, short numbers and empty input', () => {
    expect(isValidVenezuelanPhone('3121301234')).toBe(false);
    expect(isValidVenezuelanPhone('412130123')).toBe(false);
    expect(isValidVenezuelanPhone('')).toBe(false);
  });

  it('builds an E.164 value for a valid number', () => {
    expect(toVenezuelanE164('0412 1301234')).toBe('+584121301234');
    expect(toVenezuelanE164('412 1301234')).toBe('+584121301234');
  });

  it('builds an E.164 value from a number typed with the dialling code', () => {
    expect(toVenezuelanE164('+58 412 1301234')).toBe('+584121301234');
    expect(toVenezuelanE164('58 0412 1301234')).toBe('+584121301234');
  });

  it('returns null when the number cannot be converted', () => {
    expect(toVenezuelanE164('3121301234')).toBeNull();
    expect(toVenezuelanE164('+58 412 130123')).toBeNull();
  });
});
