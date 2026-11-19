import { formatDateTime } from '@/core/date';
import type { CreditHistoryEntry } from '@/core/credits';
import { cls } from '@/react/classnames';
import {
  formatContacts,
  formatHistoryRounds,
  formatMessages,
  historyCopy,
} from '@/react/screens/history/copy';

export interface AlertHistoryRowProps {
  readonly entry: CreditHistoryEntry;
  readonly locale: string;
  readonly onOpen: (id: string) => void;
}

/** Reusable history row. The whole row is a button with a full text label. */
export function AlertHistoryRow({
  entry,
  locale,
  onOpen,
}: AlertHistoryRowProps) {
  const occurredAt = formatDateTime(entry.createdAt, locale);
  const label = [
    historyCopy.kindLabels[entry.kind],
    occurredAt,
    formatContacts(entry.contactsCount),
    `${formatMessages(entry.balanceAfter)} restantes`,
    `${formatHistoryRounds(entry.rounds)} de avisos`,
  ].join(', ');

  return (
    <li className={cls('emergency-alert-row')}>
      <button
        type="button"
        className={cls('emergency-alert-row__button')}
        aria-label={label}
        onClick={() => onOpen(entry.id)}
      >
        <span className={cls('emergency-alert-row__top')}>
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
        <span className={cls('emergency-alert-row__stats')}>
          <span className={cls('emergency-alert-row__stat')}>
            {formatContacts(entry.contactsCount)}
          </span>
          <span className={cls('emergency-alert-row__stat')}>
            {formatMessages(entry.balanceAfter)}
          </span>
          <span className={cls('emergency-alert-row__stat')}>
            {formatHistoryRounds(entry.rounds)}
          </span>
        </span>
      </button>
    </li>
  );
}
