import { useId } from 'react';
import { cls } from '@/react/classnames';
import { pricingCopy } from '@/react/screens/pricing/copy';
import {
  packageRounds,
  type PricingPackage,
  type PricingPackageId,
} from '@/react/screens/pricing/data';

export interface PackageCardProps {
  readonly pkg: PricingPackage;
  readonly selected: boolean;
  readonly onSelect: (id: PricingPackageId) => void;
}

export function PackageCard({ pkg, selected, onSelect }: PackageCardProps) {
  const labelId = useId();
  const rounds = packageRounds(pkg);

  return (
    <section
      className={cls(
        'emergency-pricing__package',
        pkg.highlighted && 'emergency-pricing__package--highlighted',
      )}
      aria-labelledby={labelId}
      data-selected={selected ? 'true' : undefined}
    >
      <div className={cls('emergency-pricing__package-header')}>
        <span className={cls('emergency-pricing__package-label')} id={labelId}>
          {pkg.label}
        </span>
        {pkg.badge ? (
          <span className={cls('emergency-pricing__badge')}>{pkg.badge}</span>
        ) : null}
      </div>

      <div className={cls('emergency-pricing__price-row')}>
        <div>
          <h4 className={cls('emergency-pricing__package-name')}>
            {pkg.messages} alertas
          </h4>
          <p className={cls('emergency-pricing__package-caption')}>
            {pricingCopy.whatsapp}
          </p>
        </div>
        <div className={cls('emergency-pricing__price-meta')}>
          <span className={cls('emergency-pricing__price')}>
            {pkg.priceLabel}
          </span>
          <span className={cls('emergency-pricing__price-note')}>
            {pkg.priceCaption}
            {pkg.priceNote ? ` ${pkg.priceNote}` : null}
          </span>
        </div>
      </div>

      <div className={cls('emergency-pricing__stats')}>
        <div className={cls('emergency-pricing__stat')}>
          <p className={cls('emergency-pricing__stat-value')}>{rounds}</p>
          <p className={cls('emergency-pricing__stat-label')}>
            {pricingCopy.rounds}
          </p>
        </div>
        <div
          className={cls('emergency-pricing__stat-divider')}
          aria-hidden="true"
        />
        <div className={cls('emergency-pricing__stat')}>
          <p className={cls('emergency-pricing__stat-value')}>
            {pkg.perMessageLabel}
          </p>
          <p className={cls('emergency-pricing__stat-label')}>
            {pricingCopy.perMessage}
          </p>
        </div>
      </div>

      <p className={cls('emergency-pricing__package-footnote')}>
        {pricingCopy.footnote}
      </p>

      <button
        type="button"
        className={cls('emergency-pricing__select')}
        aria-pressed={selected}
        onClick={() => onSelect(pkg.id)}
      >
        {selected ? pricingCopy.chosen : pricingCopy.choose}
      </button>
    </section>
  );
}
