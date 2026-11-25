import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { CreditHistoryEntry } from '@/core/credits';
import { AlertHistoryRow } from '@/react/screens/history/AlertHistoryRow';

function historyEntry(
  overrides: Partial<CreditHistoryEntry> = {},
): CreditHistoryEntry {
  return {
    id: '1',
    kind: 'emergency',
    type: 'emergency',
    amount: -1,
    balanceAfter: 10,
    contactsCount: 1,
    rounds: 1,
    extraAlerts: 0,
    emergencyId: 1,
    reference: null,
    createdAt: '2026-11-20T14:30:00Z',
    status: 'delivered',
    statusTimestamp: null,
    seen: true,
    ref: null,
    reporterPhone: null,
    package: null,
    ...overrides,
  };
}

async function openSeenRow(seen: boolean): Promise<HTMLElement> {
  const user = userEvent.setup();

  render(<AlertHistoryRow entry={historyEntry({ seen })} locale="es" />);
  await user.click(screen.getByRole('button'));

  return screen.getByRole('img', { name: 'Visto' });
}

afterEach(cleanup);

describe('alert history row seen state', () => {
  it('shows a filled check when the alert was seen', async () => {
    const icon = await openSeenRow(true);

    expect(icon).toHaveAttribute('fill', 'currentColor');
    expect(icon).toHaveAttribute('stroke', 'none');
    expect(icon).toHaveClass(/emergency-alert-row__seen/);
    expect(icon).not.toHaveClass(/emergency-alert-row__seen--unseen/);
    expect(icon.innerHTML).toContain('10.6 14.39');
  });

  it('shows a filled cross when the alert was not seen', async () => {
    const icon = await openSeenRow(false);

    expect(icon).toHaveAttribute('fill', 'currentColor');
    expect(icon).toHaveAttribute('stroke', 'none');
    expect(icon).toHaveClass(/emergency-alert-row__seen--unseen/);
    expect(icon.innerHTML).toContain('13.5 12');
  });
});
