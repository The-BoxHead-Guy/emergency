import { formatDateTime } from '@/core/date';
import { cls } from '@/react/classnames';
import {
  formatContacts,
  formatHistoryRounds,
  formatMessages,
  historyCopy,
} from '@/react/screens/history/copy';
import {
  historyEntryRounds,
  type AlertHistoryEntry,
} from '@/react/screens/history/data';

export interface AlertHistoryRowProps {
  readonly entry: AlertHistoryEntry;
  readonly locale: string;
  readonly onOpen: (id: string) => void;
}

/** Reusable history row. The whole row is a button with a full text label. */
export function AlertHistoryRow({
  entry,
  locale,
  onOpen,
}: AlertHistoryRowProps) {
  const occurredAt = formatDateTime(entry.occurredAt, locale);
  const rounds = historyEntryRounds(entry);
  const label = [
    historyCopy.kindLabels[entry.kind],
    occurredAt,
    formatContacts(entry.responders),
    `${formatMessages(entry.remainingMessages)} restantes`,
    `${formatHistoryRounds(rounds)} de avisos`,
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
            dateTime={entry.occurredAt}
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
            {formatContacts(entry.responders)}
          </span>
          <span className={cls('emergency-alert-row__stat')}>
            {formatMessages(entry.remainingMessages)}
          </span>
          <span className={cls('emergency-alert-row__stat')}>
            {formatHistoryRounds(rounds)}
          </span>
        </span>
      </button>
    </li>
  );
}
