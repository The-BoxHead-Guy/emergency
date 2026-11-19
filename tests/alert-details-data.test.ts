import { describe, expect, it } from 'vitest';
import { toCreditHistoryEntry } from '@/core/credits';
import { formatDateTime } from '@/core/date';
import { formatAlertBalance } from '@/react/screens/details/copy';
import {
  historyEntryById,
  partitionHistory,
  sortedHistoryEntries,
} from '@/react/screens/history/data';
import { creditHistoryResponse } from '@/test/fakes';

const entries = creditHistoryResponse.items.map(toCreditHistoryEntry);

describe('formatDateTime', () => {
  it('formats a timestamp as dd/mm/yyyy hh:mm', () => {
    const value = new Date(2026, 9, 31, 13, 50);

    expect(formatDateTime(value)).toBe('31/10/2026 13:50');
    expect(formatDateTime(value, 'es-VE')).toBe('31/10/2026 13:50');
  });

  it('pads every part and uses 24-hour time', () => {
    const value = new Date(2026, 0, 5, 4, 7);

    expect(formatDateTime(value)).toBe('05/01/2026 04:07');
  });

  it('returns an empty string for missing or invalid input', () => {
    expect(formatDateTime(null)).toBe('');
    expect(formatDateTime('not-a-date')).toBe('');
    expect(formatDateTime(Number.NaN)).toBe('');
  });
});

describe('formatAlertBalance', () => {
  it('builds the stakeholder sentence from authoritative rounds', () => {
    expect(formatAlertBalance(27, 3, 9)).toBe(
      'Te quedan 27 mensajes de alerta, dado que tienes 3 contactos de emergencia, te quedan 9 rondas de avisos.',
    );
  });

  it('appends the extra alert allowance when present', () => {
    expect(formatAlertBalance(173, 3, 57, 2)).toBe(
      'Te quedan 173 mensajes de alerta, dado que tienes 3 contactos de emergencia, te quedan 57 rondas de avisos, más 2 alertas extra.',
    );
  });

  it('uses singular units for one message, contact, round and extra alert', () => {
    expect(formatAlertBalance(1, 1, 1, 1)).toBe(
      'Te queda 1 mensaje de alerta, dado que tienes 1 contacto de emergencia, te queda 1 ronda de avisos, más 1 alerta extra.',
    );
  });

  it('accepts a zero balance without recomputing rounds', () => {
    expect(formatAlertBalance(0, 3, 0)).toBe(
      'Te quedan 0 mensajes de alerta, dado que tienes 3 contactos de emergencia, te quedan 0 rondas de avisos.',
    );
  });

  it('returns an empty string for invalid input', () => {
    expect(formatAlertBalance(Number.NaN, 3, 9)).toBe('');
    expect(formatAlertBalance(27, Number.POSITIVE_INFINITY, 9)).toBe('');
    expect(formatAlertBalance(27, 3, -1)).toBe('');
    expect(formatAlertBalance(27, 3, 9, -1)).toBe('');
    expect(formatAlertBalance(-1, 3, 9)).toBe('');
  });
});

describe('alert history selectors', () => {
  it('resolves history entries by id', () => {
    expect(sortedHistoryEntries(entries)[0]?.id).toBe('1');
    expect(historyEntryById('2', entries)?.kind).toBe('emergency');
    expect(historyEntryById('missing', entries)).toBeNull();
    expect(historyEntryById(undefined, entries)).toBeNull();
  });

  it('sorts a copy without mutating the input order', () => {
    expect(sortedHistoryEntries(entries).map((entry) => entry.id)).toEqual([
      '1',
      '2',
    ]);
    expect(
      sortedHistoryEntries([...entries].reverse()).map((e) => e.id),
    ).toEqual(['1', '2']);
    expect(entries.map((entry) => entry.id)).toEqual(['1', '2']);
  });

  it('returns an empty list for an empty history', () => {
    expect(sortedHistoryEntries([])).toEqual([]);
  });

  it('keeps the authoritative rounds of each entry', () => {
    expect(historyEntryById('1', entries)?.rounds).toBe(57);
    expect(historyEntryById('2', entries)?.rounds).toBe(56);
  });
});

describe('partitionHistory', () => {
  const movement = (id: string, type: string) =>
    toCreditHistoryEntry({ id, type });

  it('routes alerts and unknown types away from top ups', () => {
    const partition = partitionHistory([
      movement('e1', 'emergency'),
      movement('o1', 'gift'),
      movement('r1', 'recharge'),
      movement('f1', 'refund'),
    ]);

    expect(partition.alerts.map((entry) => entry.id)).toEqual(['e1', 'o1']);
    expect(partition.topUps.map((entry) => entry.id)).toEqual(['r1', 'f1']);
  });

  it('preserves the received order in each section', () => {
    const partition = partitionHistory([
      movement('r1', 'recharge'),
      movement('e1', 'emergency'),
      movement('r2', 'refund'),
      movement('e2', 'emergency'),
    ]);

    expect(partition.alerts.map((entry) => entry.id)).toEqual(['e1', 'e2']);
    expect(partition.topUps.map((entry) => entry.id)).toEqual(['r1', 'r2']);
  });

  it('returns empty sections for an empty history', () => {
    expect(partitionHistory([])).toEqual({ alerts: [], topUps: [] });
  });
});
