import type { CreditHistoryEntry } from '@/core/credits';
import type { HistoryFilter } from '@/react/screens/types';

/** Number of history rows shown before "Ver más". */
export const HISTORY_PREVIEW_SIZE = 3;

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

/** Package name of a top-up, or `null` when the movement has no package. */
export function topUpPackageName(entry: CreditHistoryEntry): string | null {
  return entry.package?.name || null;
}

/**
 * Alerts amount shown on a top-up card.
 *
 * `package.alerts` is the number of alerts included in the purchased package.
 * When the movement has no package, the fallback is `entry.amount`: the ledger
 * amount recorded in `ledger_history` for the recharge itself, which is the
 * only quantity available for package-less movements.
 */
export function topUpAlertsAmount(entry: CreditHistoryEntry): number {
  return entry.package ? entry.package.alerts : entry.amount;
}

/** Normalizes the optional navigation param to a concrete filter. */
export function resolveHistoryFilter(
  filter: HistoryFilter | undefined,
): HistoryFilter {
  return filter === 'top-ups' ? 'top-ups' : 'alerts';
}

/** Picks the movements a filter shows from a partition. */
export function historyEntriesForFilter(
  partition: HistoryPartition,
  filter: HistoryFilter,
): CreditHistoryEntry[] {
  return filter === 'top-ups' ? partition.topUps : partition.alerts;
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
