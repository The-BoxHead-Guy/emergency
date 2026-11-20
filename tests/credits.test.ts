import { describe, expect, it } from 'vitest';
import {
  toCreditHistoryEntry,
  toCreditHistoryPage,
  toCreditSummary,
} from '@/core/credits';
import { creditHistoryResponse, creditSummaryResponse } from '@/test/fakes';

describe('credit mappers', () => {
  it('maps the summary payload to camelCase domain fields', () => {
    expect(toCreditSummary(creditSummaryResponse.credit)).toEqual({
      code: 'DABC12',
      domain: 'emergency',
      balance: 173,
      contactsCount: 3,
      rounds: 57,
      extraAlerts: 2,
      roundsLabel: '57 rounds',
    });
  });

  it('preserves zero and negative balances', () => {
    const summary = toCreditSummary({
      ...creditSummaryResponse.credit,
      balance: -4,
      rounds: 0,
      extra_alerts: 0,
    });

    expect(summary.balance).toBe(-4);
    expect(summary.rounds).toBe(0);
    expect(summary.extraAlerts).toBe(0);
  });

  it('maps a history item and keeps the raw type', () => {
    const entry = toCreditHistoryEntry(creditHistoryResponse.items[0]!);

    expect(entry).toEqual({
      id: '1',
      kind: 'recharge',
      type: 'recharge',
      amount: 173,
      balanceAfter: 173,
      contactsCount: 3,
      rounds: 57,
      extraAlerts: 2,
      emergencyId: null,
      reference: 'recharge:DEMO0001',
      createdAt: '2026-11-16T09:30:00+00:00',
    });
  });

  it('normalizes known and unknown ledger kinds', () => {
    const base = creditHistoryResponse.items[0]!;

    expect(toCreditHistoryEntry({ ...base, type: 'refund' }).kind).toBe(
      'refund',
    );
    expect(toCreditHistoryEntry({ ...base, type: 'abort' }).kind).toBe('abort');
    expect(toCreditHistoryEntry({ ...base, type: 'EMERGENCY' }).kind).toBe(
      'emergency',
    );
    expect(toCreditHistoryEntry({ ...base, type: 'simulation' }).kind).toBe(
      'other',
    );
    expect(toCreditHistoryEntry({ ...base, type: 'simulation' }).type).toBe(
      'simulation',
    );
  });

  it('maps an abort entry and keeps its emergency id', () => {
    const entry = toCreditHistoryEntry({
      id: 'ledger-abort',
      type: 'abort',
      amount: -1,
      balance_after: 7,
      contacts_count: 3,
      rounds: 1,
      emergency_id: 42,
    });

    expect(entry).toMatchObject({
      id: 'ledger-abort',
      kind: 'abort',
      type: 'abort',
      amount: -1,
      balanceAfter: 7,
      emergencyId: 42,
    });
  });

  it('maps pagination and every history entry', () => {
    const page = toCreditHistoryPage(creditHistoryResponse);

    expect(page.entries.map((entry) => entry.id)).toEqual(['1', '2']);
    expect(page.pagination).toEqual({
      total: 2,
      perPage: 15,
      currentPage: 1,
      lastPage: 1,
    });
  });

  it('tolerates missing or renamed fields instead of failing the response', () => {
    expect(
      toCreditSummary({ balance: '12', rounds: '4', future_field: true }),
    ).toEqual({
      code: '',
      domain: '',
      balance: 12,
      contactsCount: 0,
      rounds: 4,
      extraAlerts: 0,
      roundsLabel: '',
    });

    expect(toCreditHistoryEntry({})).toEqual({
      id: '',
      kind: 'other',
      type: '',
      amount: 0,
      balanceAfter: 0,
      contactsCount: 0,
      rounds: 0,
      extraAlerts: 0,
      emergencyId: null,
      reference: null,
      createdAt: null,
    });

    expect(
      toCreditHistoryEntry({
        id: 'ledger-9',
        type: 'recharge',
        created_at: 1763300000,
        emergency_id: 'EMG9',
      }),
    ).toMatchObject({
      id: 'ledger-9',
      createdAt: '1763300000',
      emergencyId: 'EMG9',
    });

    expect(toCreditHistoryPage({})).toEqual({
      entries: [],
      pagination: { total: 0, perPage: 0, currentPage: 1, lastPage: 1 },
    });
  });
});
