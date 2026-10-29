import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ResponderPayload } from '@/core/bff-types';
import { copy } from '@/core/copy';
import { createEmergencyError } from '@/core/errors';
import {
  activeEmergency,
  createFakeBff,
  createTestController,
  realtimePayload,
  responders,
} from '@/test/fakes';
import { renderEmergency } from '@tests/render';

const mounted: Array<ReturnType<typeof createTestController>> = [];

function setup(
  controller: ReturnType<typeof createTestController> = createTestController(),
) {
  mounted.push(controller);
  const view = renderEmergency(controller);

  return { controller, view };
}

async function open(controller: ReturnType<typeof createTestController>) {
  await act(async () => {
    controller.client.open();
  });

  return screen.getByRole('dialog', { name: copy.panelLabel });
}

function byClass(element: Element, suffix: string): boolean {
  return element.className.includes(suffix);
}

afterEach(() => {
  for (const controller of mounted.splice(0)) {
    controller.client.destroy();
  }
});

describe('emergency panel visual contract', () => {
  it('keeps the closed panel out of the accessibility tree', async () => {
    const { controller } = setup();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      document.querySelector('[class*="emergency-panel--hidden"]'),
    ).not.toBeNull();

    await open(controller);

    expect(
      document.querySelector('[class*="emergency-panel--hidden"]'),
    ).toBeNull();
  });

  it('renders the bp BEM shell and idle section', async () => {
    const { controller } = setup();
    const dialog = await open(controller);

    expect(byClass(dialog, 'emergency-panel')).toBe(true);
    expect(
      dialog.querySelector('[class*="emergency-panel__header"]'),
    ).not.toBeNull();
    expect(
      dialog.querySelector('[class*="emergency-panel__title"]'),
    ).toHaveTextContent(copy.panelLabel);
    expect(
      dialog.querySelector('[class*="emergency-panel__body-title"]'),
    ).toHaveTextContent(copy.question);
    expect(
      dialog.querySelector('[class*="sos-img__container"]'),
    ).not.toBeNull();
    expect(
      dialog.querySelector('[class*="emergency-panel__footer"]'),
    ).not.toBeNull();
    expect(
      dialog.querySelector('[class*="emergency-panel__button--emergency"]'),
    ).not.toBeNull();
    expect(
      dialog.querySelector('[class*="emergency-panel__button--simulation"]'),
    ).not.toBeNull();
    expect(
      screen.getByRole('button', { name: copy.emergencyAria }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: copy.testAria }),
    ).toBeInTheDocument();
  });

  it('closes with Escape and the header button', async () => {
    const user = userEvent.setup();
    const { controller } = setup();
    await open(controller);

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() =>
      expect(
        document.querySelector('[class*="emergency-panel--hidden"]'),
      ).not.toBeNull(),
    );
    expect(controller.client.getState().panelOpen).toBe(false);

    await open(controller);
    await user.click(screen.getByRole('button', { name: copy.close }));
    expect(controller.client.getState().panelOpen).toBe(false);
  });

  it('wraps keyboard focus inside the dialog', async () => {
    const { controller } = setup();
    const dialog = await open(controller);
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not([disabled])'),
    );
    const first = focusable[0];
    const last = focusable.at(-1);

    expect(first).toBeDefined();
    expect(last).toBeDefined();
    last?.focus();
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(first);
  });

  it('renders the status table with responder cells and message rows', async () => {
    const { controller } = setup();

    await act(async () => {
      await controller.client.activate();
    });

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText(copy.statusTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.responderColumn)).toBeInTheDocument();
    expect(screen.getByText(copy.sentColumn)).toBeInTheDocument();
    expect(screen.getByText(copy.deliveredColumn)).toBeInTheDocument();
    expect(screen.getByText(copy.readColumn)).toBeInTheDocument();
    expect(
      document.querySelector('[class*="emergency-status__row-container"]'),
    ).not.toBeNull();
    expect(
      document.querySelector(
        '[class*="emergency-status__message-row--success"]',
      ),
    ).not.toBeNull();
    expect(
      document.querySelector('[class*="status-icon--checked"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[class*="status-icon--unchecked"]'),
    ).not.toBeNull();
    expect(screen.getAllByText(/\d{1,2}:\d{2}(am|pm)/).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText(copy.statusPrefix, { exact: false }).length,
    ).toBeGreaterThan(0);
  });

  it('models a failed responder with the sent alert and no empty states', async () => {
    const failed: ResponderPayload = {
      ...responders[0]!,
      failed: true,
      delivered: false,
      read: false,
      sent_at: null,
      delivered_at: null,
      read_at: null,
      last_messages: [],
    };
    const bff = createFakeBff({
      activate: vi.fn(async () => ({
        emergency_id: 'emg-1',
        simulated: false,
        responders: [failed, responders[1]!],
        failures: [],
        partial_failure: false,
        total_failure: false,
      })),
    });
    const { controller } = setup(createTestController({ bff }));

    await act(async () => {
      await controller.client.activate();
    });

    const row = document.querySelector<HTMLElement>(
      '[data-responder-id="573001234567"]',
    );

    if (!row) {
      throw new Error('Expected the failed responder row to be rendered.');
    }

    expect(
      within(row).getAllByText(copy.statusPrefix, { exact: false }),
    ).toHaveLength(1);
    expect(row.querySelector('[class*="status-icon--failed"]')).not.toBeNull();
    expect(
      document.querySelector(
        '[class*="emergency-status__message-row--failed"]',
      ),
    ).not.toBeNull();
  });

  it('requires confirmation before aborting and shows feedback', async () => {
    const user = userEvent.setup();
    const { controller } = setup();

    await act(async () => {
      await controller.client.activate();
    });

    await user.click(screen.getByRole('button', { name: copy.abort }));

    const confirmation = screen.getByRole('dialog', {
      name: copy.abortConfirmTitle,
    });
    expect(confirmation).toHaveTextContent(copy.abortConfirmText);
    expect(controller.bff.abort).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: copy.abortConfirm }));

    expect(await screen.findByText(copy.abortSuccessTitle)).toBeInTheDocument();
    expect(controller.bff.abort).toHaveBeenCalledWith('emg-1');
  });

  it('requires confirmation before simulating and shows the result', async () => {
    const user = userEvent.setup();
    const { controller } = setup();
    await open(controller);

    await user.click(screen.getByRole('button', { name: copy.testAria }));
    expect(
      screen.getByRole('dialog', { name: copy.simulateConfirmTitle }),
    ).toBeInTheDocument();
    expect(controller.bff.simulacrum).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: copy.simulateConfirm }),
    );

    expect(
      await screen.findByText(copy.simulateSuccessTitle),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.simulateResultOk)).toBeInTheDocument();
    expect(controller.bff.simulacrum).toHaveBeenCalledTimes(1);
  });

  it('shows the simulation error surface', async () => {
    const user = userEvent.setup();
    const bff = createFakeBff({
      simulacrum: vi.fn(async () => {
        throw createEmergencyError('upstream_error', 'Simulation failed.');
      }),
    });
    const { controller } = setup(createTestController({ bff }));
    await open(controller);

    await user.click(screen.getByRole('button', { name: copy.testAria }));
    await user.click(
      screen.getByRole('button', { name: copy.simulateConfirm }),
    );

    expect(
      await screen.findByText(copy.simulateResultFail),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[class*="emergency-error-message"]'),
    ).not.toBeNull();
  });

  it('announces an existing emergency and opens it from the overlay', async () => {
    const user = userEvent.setup();
    const bff = createFakeBff({
      current: vi.fn(async () => ({
        active: true,
        emergency: activeEmergency,
        realtime: realtimePayload,
      })),
    });
    const { controller } = setup(createTestController({ bff }));

    await act(async () => {
      await controller.client.resume();
    });

    expect(await screen.findByText(copy.resumeTitle)).toBeInTheDocument();
    expect(
      document.querySelector(
        '[class*="emergency-resume-notification-overlay"]',
      ),
    ).not.toBeNull();

    await user.click(screen.getByRole('button', { name: copy.resumeAction }));

    expect(
      screen.getByRole('dialog', { name: copy.panelLabel }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.statusTitle)).toBeInTheDocument();
  });

  it('renders the host fallback when geolocation fails', async () => {
    const controller = createTestController({
      geolocation: {
        getCurrentPosition: async () => {
          throw Object.assign(new Error('denied'), {
            emergencyError: createEmergencyError(
              'geolocation_denied',
              'Permission denied.',
            ),
          });
        },
      },
    });
    setup(controller);

    await act(async () => {
      await controller.client.activate();
    });

    expect(await screen.findByText(copy.geolocationDenied)).toBeInTheDocument();
    const call = screen.getByRole('link', { name: /Línea de emergencia/ });
    expect(call).toHaveAttribute('href', 'tel:+573001234567');
    expect(controller.bff.activate).not.toHaveBeenCalled();
    expect(screen.queryByText(copy.activeBanner)).not.toBeInTheDocument();
  });

  it('shows the error surface with a retry action', async () => {
    const bff = createFakeBff({
      session: vi.fn(async () => {
        throw createEmergencyError('inactive_code', 'The code is inactive.');
      }),
    });
    const { controller } = setup(createTestController({ bff }));

    await act(async () => {
      await controller.client.ensureSession();
      controller.client.open();
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(copy.errorTitle);
    expect(
      screen.getByRole('button', { name: copy.retry }),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[class*="emergency-error-message__container"]'),
    ).not.toBeNull();
  });
});
