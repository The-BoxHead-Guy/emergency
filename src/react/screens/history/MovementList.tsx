import type { CreditHistoryEntry } from '@/core/credits';
import { cls } from '@/react/classnames';
import { AlertHistoryRow } from '@/react/screens/history/AlertHistoryRow';
import { TopUpCard } from '@/react/screens/history/TopUpCard';
import type { HistoryFilter } from '@/react/screens/types';

export interface MovementListProps {
  readonly entries: readonly CreditHistoryEntry[];
  readonly locale: string;
  readonly filter: HistoryFilter;
  readonly id?: string;
}

/** Renders movements as alert collapsibles or top-up cards, by filter. */
export function MovementList({
  entries,
  locale,
  filter,
  id,
}: MovementListProps) {
  if (filter === 'top-ups') {
    return (
      <ul className={cls('emergency-topups')} id={id}>
        {entries.map((entry) => (
          <TopUpCard key={entry.id} entry={entry} locale={locale} />
        ))}
      </ul>
    );
  }

  return (
    <ul className={cls('emergency-collapsibles')} id={id}>
      {entries.map((entry) => (
        <AlertHistoryRow key={entry.id} entry={entry} locale={locale} />
      ))}
    </ul>
  );
}
