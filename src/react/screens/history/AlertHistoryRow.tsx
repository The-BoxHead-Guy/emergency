import { formatDateTime } from '@/core/date';
import type { CreditHistoryEntry } from '@/core/credits';
import { cls } from '@/react/classnames';
import { Collapsible } from '@/react/components/Collapsible';
import { Icon } from '@/react/components/Icon';
import { historyCopy } from '@/react/screens/history/copy';
import type { MovementRow } from '@/react/screens/history/MovementRows';
import { MovementRows } from '@/react/screens/history/MovementRows';

export interface AlertHistoryRowProps {
  readonly entry: CreditHistoryEntry;
  readonly locale: string;
}

/** Alert movement rendered as a collapsible: timestamp and kind in the head. */
export function AlertHistoryRow({ entry, locale }: AlertHistoryRowProps) {
  const occurredAt = formatDateTime(entry.createdAt, locale);
  const detailRows: MovementRow[] = [
    ...(entry.reporterPhone
      ? [
          {
            label: historyCopy.fields.reporterPhone,
            value: entry.reporterPhone,
          },
        ]
      : []),
    ...(entry.seen
      ? [
          {
            label: historyCopy.fields.seen,
            value: (
              <Icon
                name="check-circle"
                title={historyCopy.fields.seen}
                className={cls('emergency-alert-row__seen')}
              />
            ),
          },
        ]
      : []),
  ];
  const balanceRows: MovementRow[] = [
    { label: historyCopy.stats.contacts, value: entry.contactsCount },
    { label: historyCopy.stats.messages, value: entry.balanceAfter },
    { label: historyCopy.stats.rounds, value: entry.rounds },
  ];

  return (
    <li className={cls('emergency-alert-row')}>
      <Collapsible
        head={
          <span className={cls('emergency-alert-row__summary')}>
            <time
              className={cls('emergency-alert-row__time')}
              dateTime={entry.createdAt ?? undefined}
            >
              {occurredAt}
            </time>
            <span
              className={cls('emergency-alert-row__badge')}
              data-kind={entry.kind}
            >
              {historyCopy.kindLabels[entry.kind]}
            </span>
          </span>
        }
      >
        {detailRows.length > 0 ? <MovementRows rows={detailRows} /> : null}
        <p className={cls('emergency-alert-row__subtitle')}>
          {historyCopy.sections.balance}
        </p>
        <MovementRows rows={balanceRows} />
      </Collapsible>
    </li>
  );
}
