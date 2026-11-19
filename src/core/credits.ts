import { isRecord } from '@/core/guards';
import type { EmergencyError } from '@/core/types';

/** Normalized ledger movement kind. */
export type CreditHistoryKind = 'recharge' | 'emergency' | 'refund' | 'other';

export interface CreditSummary {
  readonly code: string;
  readonly domain: string;
  readonly balance: number;
  readonly contactsCount: number;
  readonly rounds: number;
  readonly extraAlerts: number;
  readonly roundsLabel: string;
}

export interface CreditHistoryEntry {
  readonly id: string;
  readonly kind: CreditHistoryKind;
  /** Raw ledger type from the BFF. */
  readonly type: string;
  readonly amount: number;
  readonly balanceAfter: number;
  readonly contactsCount: number;
  readonly rounds: number;
  readonly extraAlerts: number;
  readonly emergencyId: string | number | null;
  readonly reference: string | null;
  readonly createdAt: string | null;
}

export interface CreditPagination {
  readonly total: number;
  readonly perPage: number;
  readonly currentPage: number;
  readonly lastPage: number;
}

export interface CreditHistoryPage {
  readonly entries: readonly CreditHistoryEntry[];
  readonly pagination: CreditPagination;
}

/** Lifecycle of one credit resource. */
export type CreditsStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Summary, history and status of both credit resources. */
export interface CreditsState {
  readonly credit: CreditSummary | null;
  readonly history: readonly CreditHistoryEntry[];
  readonly pagination: CreditPagination | null;
  readonly summaryStatus: CreditsStatus;
  readonly historyStatus: CreditsStatus;
  readonly error: EmergencyError | null;
}

export function createCreditsState(): CreditsState {
  return {
    credit: null,
    history: [],
    pagination: null,
    summaryStatus: 'idle',
    historyStatus: 'idle',
    error: null,
  };
}

function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readText(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  return typeof value === 'number' && Number.isFinite(value)
    ? String(value)
    : null;
}

function readIdentifier(value: unknown): string | number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value !== '') {
    return value;
  }

  return null;
}

export function toCreditSummary(payload: unknown): CreditSummary {
  const raw = isRecord(payload) ? payload : {};

  return {
    code: readString(raw['code']),
    domain: readString(raw['domain']),
    balance: readNumber(raw['balance']),
    contactsCount: readNumber(raw['contacts_count']),
    rounds: readNumber(raw['rounds']),
    extraAlerts: readNumber(raw['extra_alerts']),
    roundsLabel: readString(raw['rounds_label']),
  };
}

function toKind(type: string): CreditHistoryKind {
  switch (type.toLowerCase()) {
    case 'recharge':
      return 'recharge';
    case 'emergency':
      return 'emergency';
    case 'refund':
      return 'refund';
    default:
      return 'other';
  }
}

export function toCreditHistoryEntry(payload: unknown): CreditHistoryEntry {
  const raw = isRecord(payload) ? payload : {};
  const type = readString(raw['type']);
  const id = readIdentifier(raw['id']);

  return {
    id: id === null ? '' : String(id),
    kind: toKind(type),
    type,
    amount: readNumber(raw['amount']),
    balanceAfter: readNumber(raw['balance_after']),
    contactsCount: readNumber(raw['contacts_count']),
    rounds: readNumber(raw['rounds']),
    extraAlerts: readNumber(raw['extra_alerts']),
    emergencyId: readIdentifier(raw['emergency_id']),
    reference: readText(raw['reference']),
    createdAt: readText(raw['created_at']),
  };
}

function toPagination(payload: unknown): CreditPagination {
  const raw = isRecord(payload) ? payload : {};

  return {
    total: readNumber(raw['total']),
    perPage: readNumber(raw['per_page']),
    currentPage: readNumber(raw['current_page'], 1),
    lastPage: readNumber(raw['last_page'], 1),
  };
}

export function toCreditHistoryPage(response: unknown): CreditHistoryPage {
  const raw = isRecord(response) ? response : {};
  const items = Array.isArray(raw['items']) ? raw['items'] : [];

  return {
    entries: items.map(toCreditHistoryEntry),
    pagination: toPagination(raw['pagination']),
  };
}
