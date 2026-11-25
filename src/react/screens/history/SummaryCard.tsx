import type { CreditsState } from '@/core/credits';
import { cls } from '@/react/classnames';
import { creditResourceView } from '@/react/screens/credits-view';
import {
  historyAlertsUnit,
  historyContactsUnit,
  historyCopy,
  historyRoundsUnit,
} from '@/react/screens/history/copy';

export interface SummaryCardProps {
  readonly credits: CreditsState;
}

interface SummaryLineProps {
  readonly value: number;
  readonly unit: string;
  readonly prefix?: string;
}

function SummaryLine({ value, unit, prefix }: SummaryLineProps) {
  return (
    <p className={cls('emergency-history__summary-line')}>
      {prefix ? `${prefix} ` : null}
      <strong className={cls('emergency-history__summary-value')}>
        {value}
      </strong>{' '}
      {unit}
    </p>
  );
}

/** Available balance card shown above the history section title. */
export function SummaryCard({ credits }: SummaryCardProps) {
  const { credit } = credits;
  const view = creditResourceView(credits.summaryStatus, credit !== null);

  return (
    <section
      className={cls('emergency-history__summary')}
      aria-label={historyCopy.summary.title}
    >
      <div className={cls('emergency-history__summary-title-group')}>
        <h3 className={cls('emergency-history__summary-title')}>
          {historyCopy.summary.title}
        </h3>
      </div>
      <div className={cls('emergency-history__summary-body')}>
        {credit ? (
          <>
            <SummaryLine
              value={credit.rounds}
              unit={historyRoundsUnit(credit.rounds)}
            />
            <SummaryLine
              value={credit.balance}
              unit={historyAlertsUnit(credit.balance)}
            />
            <SummaryLine
              value={credit.contactsCount}
              unit={historyContactsUnit(credit.contactsCount)}
              prefix={historyCopy.summary.contactsPrefix}
            />
          </>
        ) : (
          <p className={cls('emergency-history__summary-line')}>
            {view === 'loading'
              ? historyCopy.summary.loading
              : historyCopy.summary.unavailable}
          </p>
        )}
      </div>
    </section>
  );
}
