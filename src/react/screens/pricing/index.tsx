import { useState } from 'react';
import { EmergencyHeader } from '@/react/components/EmergencyHeader';
import { useScreenNavigation } from '@/react/screens/context';
import { EmergencyScreenLayout } from '@/react/screens/layout';
import { PackageCard } from '@/react/screens/pricing/PackageCard';
import { pricingCopy } from '@/react/screens/pricing/copy';
import {
  PRICING_PACKAGES,
  type PricingPackageId,
} from '@/react/screens/pricing/data';
import type { EmergencyScreenProps } from '@/react/screens/types';
import { cls } from '@/react/classnames';

export function PricingScreen(props: EmergencyScreenProps) {
  const { back } = useScreenNavigation();
  const [selected, setSelected] = useState<PricingPackageId | null>(null);

  return (
    <EmergencyScreenLayout
      screen="pricing"
      titleId={props.titleId}
      bodyClassName="emergency-panel__body--pricing"
      header={
        <EmergencyHeader
          titleId={props.titleId}
          title={pricingCopy.title}
          onClose={() => props.onClose('close')}
          onBack={back}
        />
      }
      footer={null}
    >
      <div className={cls('emergency-pricing')}>
        <div className={cls('emergency-pricing__heading')}>
          <div className={cls('emergency-pricing__titles')}>
            <h3 className={cls('emergency-pricing__title')}>
              {pricingCopy.heading}
            </h3>
            <p className={cls('emergency-pricing__subtitle')}>
              {pricingCopy.subtitle}
            </p>
          </div>
        </div>

        {PRICING_PACKAGES.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            selected={selected === pkg.id}
            onSelect={setSelected}
          />
        ))}
      </div>
    </EmergencyScreenLayout>
  );
}
