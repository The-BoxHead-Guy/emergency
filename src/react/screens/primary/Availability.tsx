import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';
import {
  formatRounds,
  primaryCopy,
  roundsUnit,
} from '@/react/screens/primary/copy';
import {
  calculateRounds,
  DEMO_AVAILABLE_MESSAGES,
  DEMO_DESIGNATED_RESPONDERS,
} from '@/react/screens/primary/data';

export interface AvailabilityProps {
  readonly onRecharge: () => void;
  readonly onDetails: () => void;
}

export function Availability({ onRecharge, onDetails }: AvailabilityProps) {
  const rounds = calculateRounds(
    DEMO_AVAILABLE_MESSAGES,
    DEMO_DESIGNATED_RESPONDERS,
  );

  return (
    <section
      className={cls('emergency-availability')}
      aria-label={primaryCopy.availabilityTitle}
    >
      <button
        type="button"
        className={cls('emergency-availability__recharge')}
        onClick={onRecharge}
      >
        <Icon name="credit-card-plus" />
        {primaryCopy.recharge}
      </button>

      <div className={cls('emergency-availability__card')}>
        <div className={cls('emergency-availability__card-header')}>
          <h3 className={cls('emergency-availability__card-title')}>
            {primaryCopy.availabilityTitle}
          </h3>
        </div>
        <div className={cls('emergency-availability__card-body')}>
          <div
            className={cls('emergency-availability__rounds-group')}
            aria-label={formatRounds(rounds)}
          >
            <p className={cls('emergency-availability__rounds')}>{rounds}</p>
            <p className={cls('emergency-availability__label')}>
              {roundsUnit(rounds)}
            </p>
          </div>
          <button
            type="button"
            className={cls('emergency-availability__details')}
            onClick={onDetails}
          >
            {primaryCopy.details}
          </button>
        </div>
      </div>
    </section>
  );
}
