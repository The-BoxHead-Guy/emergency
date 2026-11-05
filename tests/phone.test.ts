import { describe, expect, it } from 'vitest';
import {
  formatVenezuelanPhone,
  isValidVenezuelanPhone,
  normalizeVenezuelanPhone,
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

  it('formats a complete number as three digits plus seven digits', () => {
    expect(formatVenezuelanPhone('4121301234')).toBe('412 1301234');
  });

  it('formats a partial number as the user types', () => {
    expect(formatVenezuelanPhone('4121')).toBe('412 1');
  });

  it('accepts a full national mobile number', () => {
    expect(isValidVenezuelanPhone('412 1301234')).toBe(true);
    expect(isValidVenezuelanPhone('0412 1301234')).toBe(true);
  });

  it('rejects invalid prefixes, short numbers and empty input', () => {
    expect(isValidVenezuelanPhone('3121301234')).toBe(false);
    expect(isValidVenezuelanPhone('412130123')).toBe(false);
    expect(isValidVenezuelanPhone('')).toBe(false);
  });

  it('builds an E.164 value for a valid number', () => {
    expect(toVenezuelanE164('0412 1301234')).toBe('+584121301234');
  });

  it('returns null when the number cannot be converted', () => {
    expect(toVenezuelanE164('3121301234')).toBeNull();
  });
});
