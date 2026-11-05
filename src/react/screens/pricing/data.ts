import {
  calculateRounds,
  DEMO_DESIGNATED_RESPONDERS,
} from '@/react/screens/primary/data';

export type PricingPackageId = 'package-1' | 'package-2';

export interface PricingPackage {
  readonly id: PricingPackageId;
  readonly label: string;
  readonly messages: number;
  readonly priceLabel: string;
  readonly priceNote?: string;
  readonly priceCaption: string;
  readonly perMessageLabel: string;
  readonly highlighted: boolean;
  readonly badge?: string;
}

/**
 * Local demo catalog. Prices and per-message labels are literal values from the
 * mock; they are not derived from the package totals.
 */
export const PRICING_PACKAGES = [
  {
    id: 'package-1',
    label: 'PAQUETE 1',
    messages: 100,
    priceLabel: '$7',
    priceCaption: 'IVA incluído',
    perMessageLabel: '$0.07',
    highlighted: false,
  },
  {
    id: 'package-2',
    label: 'PAQUETE 2',
    messages: 200,
    priceLabel: '12$',
    priceCaption: 'IVA incluído',
    perMessageLabel: '$0.06',
    highlighted: true,
    badge: 'MEJOR VALOR',
  },
] as const satisfies readonly PricingPackage[];

/** Derives the alert rounds a package provides for the demo responder count. */
export function packageRounds(pkg: PricingPackage): number {
  return calculateRounds(pkg.messages, DEMO_DESIGNATED_RESPONDERS);
}
