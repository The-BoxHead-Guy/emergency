import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { copy } from '@/core/copy';
import { pricingCopy } from '@/react/screens/pricing/copy';
import { primaryCopy } from '@/react/screens/primary/copy';
import { createTestController } from '@/test/fakes';
import { renderEmergency } from '@tests/render';

const mounted: Array<ReturnType<typeof createTestController>> = [];

function setup(
  controller: ReturnType<typeof createTestController> = createTestController(),
) {
  mounted.push(controller);

  return { controller, view: renderEmergency(controller) };
}

async function open(controller: ReturnType<typeof createTestController>) {
  await act(async () => {
    controller.client.open();
  });

  return screen.getByRole('dialog', { name: copy.panelLabel });
}

function screenById(id: string): HTMLElement {
  const element = document.querySelector(`[data-screen="${id}"]`);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`Screen "${id}" is not mounted.`);
  }

  return element;
}

async function openPricing() {
  const user = userEvent.setup();
  const { controller } = setup();
  await open(controller);

  await user.click(screen.getByRole('button', { name: primaryCopy.recharge }));

  return { controller, user, pricing: screenById('pricing') };
}

afterEach(() => {
  for (const controller of mounted.splice(0)) {
    controller.client.destroy();
  }

  cleanup();
});

describe('pricing screen', () => {
  it('renders both packages inside the pricing screen', async () => {
    const { pricing } = await openPricing();

    expect(
      within(pricing).getByRole('heading', {
        level: 3,
        name: pricingCopy.heading,
      }),
    ).toBeInTheDocument();
    expect(within(pricing).getByText(pricingCopy.subtitle)).toBeInTheDocument();
    expect(within(pricing).getByText('PAQUETE 1')).toBeInTheDocument();
    expect(within(pricing).getByText('100 alertas')).toBeInTheDocument();
    expect(within(pricing).getByText('PAQUETE 2')).toBeInTheDocument();
    expect(within(pricing).getByText('200 alertas')).toBeInTheDocument();
    expect(within(pricing).getByText(pricingCopy.footnote)).toBeInTheDocument();
  });

  it('shows the best-value badge only on the highlighted package', async () => {
    const { pricing } = await openPricing();

    expect(within(pricing).getAllByText(pricingCopy.bestValue)).toHaveLength(1);

    const badge = within(pricing).getByText(pricingCopy.bestValue);
    const card = badge.closest('section');

    expect(card).toHaveTextContent('PAQUETE 2');
    expect(card).toHaveTextContent('200 alertas');
  });

  it('keeps the back button in the header and returns to primary', async () => {
    const { user, pricing } = await openPricing();
    const dialog = screen.getByRole('dialog', { name: pricingCopy.title });
    const backButton = within(pricing).getByRole('button', { name: copy.back });

    expect(dialog.querySelector('header')?.contains(backButton)).toBe(true);

    await user.click(backButton);

    expect(document.querySelector('[data-screen="primary"]')).not.toBeNull();
    expect(document.querySelector('[data-screen="pricing"]')).toBeNull();
  });

  it('focuses the header heading when entering pricing', async () => {
    await openPricing();

    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 2, name: pricingCopy.title }),
    );
  });

  it('marks only the clicked package as selected', async () => {
    const { user, pricing } = await openPricing();
    const selectButtons = within(pricing).getAllByRole('button', {
      name: pricingCopy.choose,
    });

    expect(selectButtons).toHaveLength(2);

    const firstButton = selectButtons[0];
    const secondButton = selectButtons[1];

    if (!firstButton || !secondButton) {
      throw new Error('Expected two package select buttons.');
    }

    await user.click(firstButton);

    expect(firstButton).toHaveAttribute('aria-pressed', 'true');
    expect(firstButton).toHaveTextContent(pricingCopy.chosen);
    expect(firstButton.closest('section')).toHaveAttribute('data-selected');
    expect(secondButton).toHaveAttribute('aria-pressed', 'false');
    expect(secondButton).toHaveTextContent(pricingCopy.choose);
    expect(secondButton.closest('section')).not.toHaveAttribute(
      'data-selected',
    );
  });

  it('does not render the shared footer', async () => {
    const { pricing } = await openPricing();

    expect(pricing.querySelector('footer')).toBeNull();
    expect(
      within(pricing).queryByRole('button', { name: copy.emergencyAria }),
    ).toBeNull();
    expect(
      within(pricing).queryByRole('button', { name: copy.testAria }),
    ).toBeNull();
  });

  it('returns to primary when an emergency becomes active', async () => {
    const { controller, pricing } = await openPricing();

    expect(pricing).toBeInTheDocument();

    await act(async () => {
      await controller.client.activate();
    });

    await waitFor(() =>
      expect(document.querySelector('[data-screen="primary"]')).not.toBeNull(),
    );
  });
});
