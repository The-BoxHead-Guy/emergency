import { describe, expect, it } from 'vitest';
import {
  extraAlertsUnit,
  formatExtraAlerts,
} from '@/react/screens/credits-copy';
import { creditResourceView } from '@/react/screens/credits-view';
import { historyCopy } from '@/react/screens/history/copy';

describe('credit copy', () => {
  it('formats extra alerts with singular and plural units', () => {
    expect(formatExtraAlerts(1)).toBe('más 1 alerta extra');
    expect(formatExtraAlerts(2)).toBe('más 2 alertas extra');
    expect(extraAlertsUnit(1)).toBe('alerta extra');
    expect(extraAlertsUnit(0)).toBe('alertas extra');
  });
});

describe('history copy', () => {
  it('labels an abort debit as an abort', () => {
    expect(historyCopy.kindLabels.abort).toBe('Aborto');
  });

  it('labels a simulacrum movement', () => {
    expect(historyCopy.kindLabels.simulacrum).toBe('Simulacro');
  });
});

describe('credit resource view', () => {
  it('reports loaded resources regardless of whether they have a value', () => {
    expect(creditResourceView('ready', true)).toBe('ready');
    expect(creditResourceView('ready', false)).toBe('ready');
  });

  it('reports loading, error and idle states', () => {
    expect(creditResourceView('idle', false)).toBe('idle');
    expect(creditResourceView('loading', false)).toBe('loading');
    expect(creditResourceView('error', false)).toBe('error');
  });

  it('prefers a value over a stale status', () => {
    expect(creditResourceView('error', true)).toBe('ready');
    expect(creditResourceView('loading', true)).toBe('ready');
  });
});
