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
      status: 'read',
      statusTimestamp: '2026-11-16T09:31:00.000000Z',
      seen: true,
      ref: 'SYS-000000001',
      reporterPhone: null,
      package: {
        id: '01m87evag4pjrz20pzqjgykz5j',
        displayableId: 'emergency-alerts-100',
        name: 'PAQUETE',
        alerts: 100,
      },
    });
  });

  it('normalizes known and unknown ledger kinds', () => {
    const base = creditHistoryResponse.items[0]!;

    expect(toCreditHistoryEntry({ ...base, type: 'refund' }).kind).toBe(
      'refund',
    );
    expect(toCreditHistoryEntry({ ...base, type: 'abort' }).kind).toBe('abort');
    expect(toCreditHistoryEntry({ ...base, type: 'simulacrum' }).kind).toBe(
      'simulacrum',
    );
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

    expect(page.entries.map((entry) => entry.id)).toEqual(['1', '2', '3', '4']);
    expect(page.pagination).toEqual({
      total: 4,
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
      status: null,
      statusTimestamp: null,
      seen: false,
      ref: null,
      reporterPhone: null,
      package: null,
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

  it.each(['pending', 'sent', 'delivered', 'read', 'failed'] as const)(
    'maps the %s delivery status',
    (status) => {
      expect(
        toCreditHistoryEntry({ id: 1, type: 'emergency', status }).status,
      ).toBe(status);
    },
  );

  it('maps an unknown or absent delivery status to null', () => {
    expect(
      toCreditHistoryEntry({ id: 1, type: 'emergency', status: 'queued' })
        .status,
    ).toBeNull();
    expect(
      toCreditHistoryEntry({ id: 1, type: 'emergency', status: null }).status,
    ).toBeNull();
    expect(
      toCreditHistoryEntry({ id: 1, type: 'emergency' }).status,
    ).toBeNull();
  });

  it('maps status_timestamp as a nullable string', () => {
    expect(
      toCreditHistoryEntry({
        id: 1,
        status_timestamp: '2026-11-23T18:22:39.000000Z',
      }).statusTimestamp,
    ).toBe('2026-11-23T18:22:39.000000Z');
    expect(
      toCreditHistoryEntry({ id: 1, status_timestamp: null }).statusTimestamp,
    ).toBeNull();
    expect(toCreditHistoryEntry({ id: 1 }).statusTimestamp).toBeNull();
  });

  it('keeps seen as provided and defaults absent or non-boolean values to false', () => {
    expect(toCreditHistoryEntry({ id: 1, seen: true }).seen).toBe(true);
    expect(
      toCreditHistoryEntry({ id: 1, status: 'delivered', seen: true }).seen,
    ).toBe(true);
    expect(
      toCreditHistoryEntry({ id: 1, status: 'read', seen: false }).seen,
    ).toBe(false);
    expect(toCreditHistoryEntry({ id: 1 }).seen).toBe(false);
    expect(toCreditHistoryEntry({ id: 1, seen: 'yes' }).seen).toBe(false);
  });

  it('maps ref and reporter_phone as nullable strings', () => {
    expect(
      toCreditHistoryEntry({
        id: 1,
        ref: 'SYS-000000501',
        reporter_phone: '573001234567',
      }),
    ).toMatchObject({ ref: 'SYS-000000501', reporterPhone: '573001234567' });
    expect(
      toCreditHistoryEntry({ id: 1, ref: null, reporter_phone: null }),
    ).toMatchObject({ ref: null, reporterPhone: null });
    expect(toCreditHistoryEntry({ id: 1 })).toMatchObject({
      ref: null,
      reporterPhone: null,
    });
  });

  it('maps a package object and defaults its missing subfields', () => {
    expect(
      toCreditHistoryEntry({
        id: 1,
        package: {
          id: '01m87evag4pjrz20pzqjgykz5j',
          displayable_id: 'emergency-alerts-100',
          name: 'PAQUETE',
          alerts: 100,
        },
      }).package,
    ).toEqual({
      id: '01m87evag4pjrz20pzqjgykz5j',
      displayableId: 'emergency-alerts-100',
      name: 'PAQUETE',
      alerts: 100,
    });

    expect(
      toCreditHistoryEntry({ id: 1, package: { name: 'X' } }).package,
    ).toEqual({ id: '', displayableId: '', name: 'X', alerts: 0 });
  });

  it('maps a null, absent or malformed package to null', () => {
    expect(toCreditHistoryEntry({ id: 1, package: null }).package).toBeNull();
    expect(toCreditHistoryEntry({ id: 1 }).package).toBeNull();
    expect(
      toCreditHistoryEntry({ id: 1, package: 'PAQUETE' }).package,
    ).toBeNull();
    expect(toCreditHistoryEntry({ id: 1, package: 100 }).package).toBeNull();
  });

  it('tolerates an older BFF that omits every delivery field', () => {
    expect(
      toCreditHistoryEntry({
        id: 3,
        type: 'recharge',
        amount: 10,
        balance_after: 10,
        contacts_count: 0,
        rounds: 2,
        extra_alerts: 0,
        emergency_id: null,
        reference: null,
        created_at: null,
      }),
    ).toMatchObject({
      status: null,
      statusTimestamp: null,
      seen: false,
      ref: null,
      reporterPhone: null,
      package: null,
    });
  });
});
