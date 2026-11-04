import { describe, expect, it } from 'vitest';
import { packageRounds, PRICING_PACKAGES } from '@/react/screens/pricing/data';

describe('pricing catalog', () => {
  it('derives the alert rounds for both packages', () => {
    expect(packageRounds(PRICING_PACKAGES[0])).toBe(33);
    expect(packageRounds(PRICING_PACKAGES[1])).toBe(66);
  });

  it('uses unique package ids', () => {
    expect(new Set(PRICING_PACKAGES.map((pkg) => pkg.id)).size).toBe(
      PRICING_PACKAGES.length,
    );
  });

  it('preserves the literal price labels from the mock', () => {
    expect(PRICING_PACKAGES.map((pkg) => pkg.priceLabel)).toEqual([
      '$7',
      '12$',
    ]);
    expect(PRICING_PACKAGES.map((pkg) => pkg.perMessageLabel)).toEqual([
      '$0.06',
      '$0.05',
    ]);
    expect(PRICING_PACKAGES[1].priceNote).toBe('($10 + IVA)');
  });

  it('only highlights the best-value package and gives it a badge', () => {
    const highlighted = PRICING_PACKAGES.filter((pkg) => pkg.highlighted);
    const badged = PRICING_PACKAGES.filter((pkg) => 'badge' in pkg);

    expect(highlighted).toHaveLength(1);
    expect(highlighted[0]?.id).toBe('package-2');
    expect(badged).toHaveLength(1);
    expect(badged[0]?.id).toBe('package-2');
    expect(PRICING_PACKAGES[1].badge).toBe('MEJOR VALOR');
  });
});
