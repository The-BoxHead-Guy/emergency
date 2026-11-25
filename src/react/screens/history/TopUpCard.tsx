import { formatDateTime } from '@/core/date';
import type { CreditHistoryEntry } from '@/core/credits';
import { cls } from '@/react/classnames';
import { historyCopy } from '@/react/screens/history/copy';
import {
  topUpAlertsAmount,
  topUpPackageName,
} from '@/react/screens/history/data';
import type { MovementRow } from '@/react/screens/history/MovementRows';
import { MovementRows } from '@/react/screens/history/MovementRows';

export interface TopUpCardProps {
  readonly entry: CreditHistoryEntry;
  readonly locale: string;
}

/** Top-up movement rendered as a card with its package, alerts and ref. */
export function TopUpCard({ entry, locale }: TopUpCardProps) {
  const occurredAt = formatDateTime(entry.createdAt, locale);
  const packageName = topUpPackageName(entry);
  const fields: MovementRow[] = [
    ...(packageName
      ? [{ label: historyCopy.fields.package, value: packageName }]
      : []),
    {
      label: historyCopy.fields.alerts,
      value: topUpAlertsAmount(entry),
    },
    ...(entry.ref ? [{ label: historyCopy.fields.ref, value: entry.ref }] : []),
  ];

  return (
    <li className={cls('emergency-topup-card')}>
      <div className={cls('emergency-topup-card__header')}>
        <time
          className={cls('emergency-topup-card__time')}
          dateTime={entry.createdAt ?? undefined}
        >
          {occurredAt}
        </time>
        <span
          className={cls('emergency-topup-card__kind')}
          data-kind={entry.kind}
        >
          {historyCopy.kindLabels[entry.kind]}
        </span>
      </div>

      <MovementRows rows={fields} />
    </li>
  );
}
