import type { CreditsState } from '@/core/credits';
import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';
import { formatExtraAlerts } from '@/react/screens/credits-copy';
import { creditResourceView } from '@/react/screens/credits-view';
import {
  formatRounds,
  primaryCopy,
  roundsUnit,
} from '@/react/screens/primary/copy';

export interface AvailabilityProps {
  readonly credits: CreditsState;
  readonly onRecharge: () => void;
  readonly onDetails: () => void;
}

export function Availability({
  credits,
  onRecharge,
  onDetails,
}: AvailabilityProps) {
  const { credit } = credits;
  const view = creditResourceView(credits.summaryStatus, credit !== null);

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
        <Icon name="return-on-investment" size="1.75rem" />
        {primaryCopy.recharge}
      </button>

      <div className={cls('emergency-availability__card')}>
        <div className={cls('emergency-availability__card-header')}>
          <h3 className={cls('emergency-availability__card-title')}>
            {primaryCopy.availabilityTitle}
          </h3>
        </div>
        <div className={cls('emergency-availability__card-body')}>
          {credit ? (
            <div
              className={cls('emergency-availability__rounds-group')}
              aria-label={formatRounds(credit.rounds)}
            >
              <p className={cls('emergency-availability__rounds')}>
                {credit.rounds}
              </p>
              <p className={cls('emergency-availability__label')}>
                {roundsUnit(credit.rounds)}
              </p>
              {credit.extraAlerts > 0 ? (
                <p className={cls('emergency-availability__label')}>
                  {formatExtraAlerts(credit.extraAlerts)}
                </p>
              ) : null}
            </div>
          ) : (
            <p className={cls('emergency-availability__label')}>
              {view === 'loading'
                ? primaryCopy.loading
                : primaryCopy.unavailable}
            </p>
          )}
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
