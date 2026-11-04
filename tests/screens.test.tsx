import { act, cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EmergencyResultPayload } from '@/core/bff-types';
import { copy } from '@/core/copy';
import { pricingCopy } from '@/react/screens/pricing/copy';
import { primaryCopy } from '@/react/screens/primary/copy';
import { createFakeBff, createTestController, responders } from '@/test/fakes';
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

function screenById(id: string): Element | null {
  return document.querySelector(`[data-screen="${id}"]`);
}

afterEach(() => {
  for (const controller of mounted.splice(0)) {
    controller.client.destroy();
  }

  cleanup();
});

describe('emergency availability and screen navigation', () => {
  it('shows the availability section on the idle primary screen', async () => {
    const { controller } = setup();
    await open(controller);

    expect(screenById('primary')).not.toBeNull();
    expect(
      document.querySelector('[class*="emergency-availability"]'),
    ).not.toBeNull();
  });

  it('opens pricing from Recargar and returns with Volver', async () => {
    const user = userEvent.setup();
    const { controller } = setup();
    await open(controller);

    await user.click(
      screen.getByRole('button', { name: primaryCopy.recharge }),
    );

    expect(screenById('pricing')).not.toBeNull();
    expect(screenById('primary')).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 2, name: pricingCopy.title }),
    );

    const pricingDialog = screen.getByRole('dialog', {
      name: pricingCopy.title,
    });
    const backButton = screen.getByRole('button', { name: copy.back });

    expect(pricingDialog.querySelector('header')?.contains(backButton)).toBe(
      true,
    );
    expect(pricingDialog.querySelector('footer')).toBeNull();

    await user.click(backButton);

    expect(screenById('primary')).not.toBeNull();
    expect(screenById('pricing')).toBeNull();
  });

  it('opens details from the availability card', async () => {
    const user = userEvent.setup();
    const { controller } = setup();
    await open(controller);

    await user.click(screen.getByRole('button', { name: primaryCopy.details }));

    expect(screenById('details')).not.toBeNull();
    expect(screenById('primary')).toBeNull();
  });

  it('returns to primary when an emergency becomes active', async () => {
    const user = userEvent.setup();
    const { controller } = setup();
    await open(controller);

    await user.click(
      screen.getByRole('button', { name: primaryCopy.recharge }),
    );
    expect(screenById('pricing')).not.toBeNull();

    await act(async () => {
      await controller.client.activate();
    });

    await waitFor(() => expect(screenById('primary')).not.toBeNull());
  });

  it('returns to primary when feedback becomes active', async () => {
    const user = userEvent.setup();
    const { controller } = setup();

    await act(async () => {
      await controller.client.ensureSession();
    });
    await open(controller);

    await user.click(screen.getByRole('button', { name: primaryCopy.details }));
    expect(screenById('details')).not.toBeNull();

    await act(async () => {
      await controller.client.simulate();
    });

    await waitFor(() => expect(screenById('primary')).not.toBeNull());
  });

  it('returns to primary while activation is loading', async () => {
    const user = userEvent.setup();
    let resolveActivate: ((value: EmergencyResultPayload) => void) | null =
      null;
    const bff = createFakeBff({
      activate: vi.fn(
        () =>
          new Promise<EmergencyResultPayload>((resolve) => {
            resolveActivate = resolve;
          }),
      ),
    });
    const { controller } = setup(createTestController({ bff }));

    await act(async () => {
      await controller.client.ensureSession();
    });
    await open(controller);

    await user.click(
      screen.getByRole('button', { name: primaryCopy.recharge }),
    );
    expect(screenById('pricing')).not.toBeNull();

    act(() => {
      void controller.client.activate();
    });

    await waitFor(() =>
      expect(controller.client.getState().phase.kind).toBe('activating'),
    );
    await waitFor(() => expect(screenById('primary')).not.toBeNull());

    await act(async () => {
      resolveActivate?.({
        emergency_id: 'emg-1',
        simulated: false,
        responders,
        failures: [],
        partial_failure: false,
        total_failure: false,
      });
    });
  });

  it('resets to primary when the panel closes', async () => {
    const user = userEvent.setup();
    const { controller } = setup();
    await open(controller);

    await user.click(
      screen.getByRole('button', { name: primaryCopy.recharge }),
    );
    expect(screenById('pricing')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: copy.close }));

    await waitFor(() => expect(screenById('primary')).not.toBeNull());

    await open(controller);

    expect(screenById('primary')).not.toBeNull();
  });

  it('restores focus to the trigger after closing the panel', async () => {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.textContent = 'Open emergency';
    document.body.append(trigger);
    trigger.focus();

    const { controller } = setup();

    await act(async () => {
      controller.client.open();
    });

    await waitFor(() => expect(screenById('primary')).not.toBeNull());

    await act(async () => {
      controller.client.close('close');
    });

    await waitFor(() => expect(document.activeElement).toBe(trigger));

    trigger.remove();
  });
});
