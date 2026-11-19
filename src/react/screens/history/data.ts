import type { CreditHistoryEntry } from '@/core/credits';

/** Number of history rows shown before "Ver más". */
export const HISTORY_PREVIEW_SIZE = 2;

function timestamp(entry: CreditHistoryEntry): number {
  if (!entry.createdAt) {
    return Number.NEGATIVE_INFINITY;
  }

  const value = new Date(entry.createdAt).getTime();

  return Number.isNaN(value) ? Number.NEGATIVE_INFINITY : value;
}

/** Returns a newest-first copy of the given history. */
export function sortedHistoryEntries(
  entries: readonly CreditHistoryEntry[],
): CreditHistoryEntry[] {
  return [...entries].sort(
    (first, second) => timestamp(second) - timestamp(first),
  );
}

/** Resolves a single history entry by id. */
export function historyEntryById(
  id: string | undefined,
  entries: readonly CreditHistoryEntry[],
): CreditHistoryEntry | null {
  if (!id) {
    return null;
  }

  return entries.find((entry) => entry.id === id) ?? null;
}

export interface HistoryPartition {
  readonly alerts: CreditHistoryEntry[];
  readonly topUps: CreditHistoryEntry[];
}

/** Splits history into alert movements and top-up movements. */
export function partitionHistory(
  entries: readonly CreditHistoryEntry[],
): HistoryPartition {
  const alerts: CreditHistoryEntry[] = [];
  const topUps: CreditHistoryEntry[] = [];

  for (const entry of entries) {
    if (entry.kind === 'recharge' || entry.kind === 'refund') {
      topUps.push(entry);
    } else {
      alerts.push(entry);
    }
  }

  return { alerts, topUps };
}
