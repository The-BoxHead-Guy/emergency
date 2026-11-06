import { describe, expect, it } from 'vitest';
import { formatDateTime } from '@/core/date';
import { formatAlertBalance } from '@/react/screens/details/copy';
import {
  currentAlertBalance,
  historyEntryById,
  historyEntryRounds,
  latestHistoryEntry,
} from '@/react/screens/history/data';
import {
  calculateRounds,
  DEMO_AVAILABLE_MESSAGES,
  DEMO_DESIGNATED_RESPONDERS,
} from '@/react/screens/primary/data';

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
  it('builds the exact stakeholder sentence for 27 messages and 3 contacts', () => {
    expect(formatAlertBalance(27, 3)).toBe(
      'Te quedan 27 mensajes de alerta, dado que tienes 3 contactos de emergencia, te quedan 9 rondas de avisos.',
    );
  });

  it('uses singular units for one message, contact and round', () => {
    expect(formatAlertBalance(1, 1)).toBe(
      'Te queda 1 mensaje de alerta, dado que tienes 1 contacto de emergencia, te queda 1 ronda de avisos.',
    );
  });

  it('returns an empty string for invalid input', () => {
    expect(formatAlertBalance(Number.NaN, 3)).toBe('');
    expect(formatAlertBalance(27, Number.POSITIVE_INFINITY)).toBe('');
    expect(formatAlertBalance(-1, 3)).toBe('');
  });
});

describe('alert history selectors', () => {
  it('returns the newest entry and resolves entries by id', () => {
    expect(latestHistoryEntry()?.id).toBe('alert-2026-10-31');
    expect(historyEntryById('alert-2026-10-20')?.kind).toBe('recharge');
    expect(historyEntryById('missing')).toBeNull();
    expect(historyEntryById(undefined)).toBeNull();
  });

  it('derives rounds per entry', () => {
    const latest = latestHistoryEntry();

    if (!latest) {
      throw new Error('Expected a demo history entry.');
    }

    expect(historyEntryRounds(latest)).toBe(9);
  });

  it('derives the current balance from the newest entry', () => {
    expect(currentAlertBalance()).toEqual({
      messages: 27,
      responders: 3,
      rounds: 9,
    });
    expect(currentAlertBalance([])).toBeNull();
  });

  it('keeps the newest demo entry aligned with the primary demo constants', () => {
    const latest = latestHistoryEntry();

    if (!latest) {
      throw new Error('Expected a demo history entry.');
    }

    expect(latest.remainingMessages).toBe(DEMO_AVAILABLE_MESSAGES);
    expect(latest.responders).toBe(DEMO_DESIGNATED_RESPONDERS);
    expect(historyEntryRounds(latest)).toBe(
      calculateRounds(DEMO_AVAILABLE_MESSAGES, DEMO_DESIGNATED_RESPONDERS),
    );
  });
});
