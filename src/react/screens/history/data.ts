import { calculateRounds } from '@/react/screens/primary/data';

/** The kind of alert movement recorded in the history. */
export type AlertHistoryKind = 'emergency' | 'test' | 'recharge';

export interface AlertHistoryEntry {
  readonly id: string;
  readonly kind: AlertHistoryKind;
  /** Local timestamp formatted with `formatDateTime`. */
  readonly occurredAt: string;
  readonly responders: number;
  readonly remainingMessages: number;
}

export interface AlertBalance {
  readonly messages: number;
  readonly responders: number;
  readonly rounds: number;
}

/** Number of history rows shown before "Ver más". */
export const HISTORY_PREVIEW_SIZE = 2;

/** Local demo alert history, newest first. */
export const DEMO_ALERT_HISTORY = [
  {
    id: 'alert-2026-10-31',
    kind: 'emergency',
    occurredAt: '2026-10-31T13:50:00',
    responders: 3,
    remainingMessages: 27,
  },
  {
    id: 'alert-2026-10-20',
    kind: 'recharge',
    occurredAt: '2026-10-20T09:15:00',
    responders: 3,
    remainingMessages: 100,
  },
  {
    id: 'alert-2026-10-12',
    kind: 'test',
    occurredAt: '2026-10-12T18:40:00',
    responders: 3,
    remainingMessages: 73,
  },
  {
    id: 'alert-2026-10-01',
    kind: 'recharge',
    occurredAt: '2026-10-01T11:05:00',
    responders: 3,
    remainingMessages: 76,
  },
] as const satisfies readonly AlertHistoryEntry[];

/** Returns a newest-first copy of the history. */
export function sortedHistoryEntries(
  entries: readonly AlertHistoryEntry[] = DEMO_ALERT_HISTORY,
): AlertHistoryEntry[] {
  return [...entries].sort(
    (first, second) =>
      new Date(second.occurredAt).getTime() -
      new Date(first.occurredAt).getTime(),
  );
}

/** Newest entry, used as the source of the current balance. */
export function latestHistoryEntry(
  entries: readonly AlertHistoryEntry[] = DEMO_ALERT_HISTORY,
): AlertHistoryEntry | null {
  return sortedHistoryEntries(entries)[0] ?? null;
}

/** Resolves a single history entry by id. */
export function historyEntryById(
  id: string | undefined,
  entries: readonly AlertHistoryEntry[] = DEMO_ALERT_HISTORY,
): AlertHistoryEntry | null {
  if (!id) {
    return null;
  }

  return entries.find((entry) => entry.id === id) ?? null;
}

/** Rounds represented by the entry's remaining messages and responders. */
export function historyEntryRounds(entry: AlertHistoryEntry): number {
  return calculateRounds(entry.remainingMessages, entry.responders);
}

/** Current balance derived from the newest history entry. */
export function currentAlertBalance(
  entries: readonly AlertHistoryEntry[] = DEMO_ALERT_HISTORY,
): AlertBalance | null {
  const latest = latestHistoryEntry(entries);

  if (!latest) {
    return null;
  }

  return {
    messages: latest.remainingMessages,
    responders: latest.responders,
    rounds: historyEntryRounds(latest),
  };
}
