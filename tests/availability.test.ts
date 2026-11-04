import { describe, expect, it } from 'vitest';
import { calculateRounds } from '@/react/screens/primary/data';

describe('calculateRounds', () => {
  it('derives rounds from available messages and designated responders', () => {
    expect(calculateRounds(100, 3)).toBe(33);
    expect(calculateRounds(200, 3)).toBe(66);
    expect(calculateRounds(100, 2)).toBe(50);
    expect(calculateRounds(100, 1)).toBe(100);
    expect(calculateRounds(5, 3)).toBe(1);
  });

  it('falls back to one round for zero responders', () => {
    expect(calculateRounds(100, 0)).toBe(1);
    expect(calculateRounds(100, -3)).toBe(1);
  });

  it('falls back to one round for invalid input', () => {
    expect(calculateRounds(Number.NaN, 3)).toBe(1);
    expect(calculateRounds(100, Number.NaN)).toBe(1);
    expect(calculateRounds(Number.POSITIVE_INFINITY, 3)).toBe(1);
    expect(calculateRounds(0, 3)).toBe(1);
  });
});
