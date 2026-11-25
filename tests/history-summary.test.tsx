import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createCreditsState,
  toCreditSummary,
  type CreditsState,
  type CreditsStatus,
} from '@/core/credits';
import { SummaryCard } from '@/react/screens/history/SummaryCard';

function creditsState(
  credit: CreditsState['credit'],
  summaryStatus: CreditsStatus = 'ready',
): CreditsState {
  return { ...createCreditsState(), credit, summaryStatus };
}

afterEach(cleanup);

describe('history summary card', () => {
  it('shows the available rounds, alerts and contacts', () => {
    const credit = toCreditSummary({
      rounds: 57,
      balance: 173,
      contacts_count: 3,
    });

    render(<SummaryCard credits={creditsState(credit)} />);

    expect(
      screen.getByRole('heading', { name: 'Disponible' }),
    ).toBeInTheDocument();

    const card = screen.getByRole('region', { name: 'Disponible' });

    expect(card).toHaveTextContent('57 Rondas');
    expect(card).toHaveTextContent('173 Alertas');
    expect(card).toHaveTextContent('para 3 contactos');
  });

  it('shows the loading message while the summary is pending', () => {
    render(<SummaryCard credits={creditsState(null, 'loading')} />);

    expect(screen.getByText('Cargando tu saldo…')).toBeInTheDocument();
  });

  it('shows the unavailable message when the summary fails', () => {
    render(<SummaryCard credits={creditsState(null, 'error')} />);

    expect(screen.getByText('No pudimos cargar tu saldo.')).toBeInTheDocument();
  });
});
