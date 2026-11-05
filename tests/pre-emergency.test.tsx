import { act, cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copy } from '@/core/copy';
import { createEmergencyError } from '@/core/errors';
import { preEmergencyCopy } from '@/react/screens/pre-emergency/copy';
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

function screenById(id: string): Element | null {
  return document.querySelector(`[data-screen="${id}"]`);
}

async function openPreEmergency(
  controller: ReturnType<typeof createTestController>,
) {
  const user = userEvent.setup();
  await open(controller);
  await user.click(screen.getByRole('button', { name: copy.emergencyAria }));

  return user;
}

afterEach(() => {
  for (const controller of mounted.splice(0)) {
    controller.client.destroy();
  }

  cleanup();
});

describe('pre-emergency screen', () => {
  it('opens from the primary emergency button without activating', async () => {
    const { controller } = setup();
    await openPreEmergency(controller);

    expect(screenById('pre-emergency')).not.toBeNull();
    expect(screenById('primary')).toBeNull();
    expect(
      screen.getByRole('dialog', { name: preEmergencyCopy.title }),
    ).toBeInTheDocument();
    expect(controller.bff.activate).not.toHaveBeenCalled();
  });

  it('renders the location notice and the single-button footer', async () => {
    const { controller } = setup();
    await openPreEmergency(controller);

    expect(screen.getByRole('note')).toHaveTextContent(
      preEmergencyCopy.permissionNotice,
    );
    expect(
      document.querySelector('[class*="emergency-panel__footer--single"]'),
    ).not.toBeNull();
  });

  it('keeps the area code fixed at +58', async () => {
    const { controller } = setup();
    await openPreEmergency(controller);

    const areaCode = screen.getByLabelText(preEmergencyCopy.areaCodeLabel);

    expect(areaCode).toHaveValue('+58');
    expect(areaCode).toBeDisabled();
  });

  it('disables the emergency action until the phone is valid', async () => {
    const { controller } = setup();
    const user = await openPreEmergency(controller);
    const phone = screen.getByLabelText(preEmergencyCopy.phoneLabel);
    const submit = screen.getByRole('button', { name: copy.emergencyAria });

    expect(submit).toBeDisabled();

    await user.type(phone, '4121');

    expect(submit).toBeDisabled();

    await user.type(phone, '301234');

    expect(phone).toHaveValue('412 1301234');
    expect(phone.className).toContain('emergency-pre-emergency__input--valid');
    expect(submit).toBeEnabled();
  });

  it('marks both inputs valid when the number is complete', async () => {
    const { controller } = setup();
    const user = await openPreEmergency(controller);
    const areaCode = screen.getByLabelText(preEmergencyCopy.areaCodeLabel);
    const phone = screen.getByLabelText(preEmergencyCopy.phoneLabel);

    await user.type(phone, '412 1301234');

    expect(areaCode.className).toContain(
      'emergency-pre-emergency__input--valid',
    );
    expect(phone.className).toContain('emergency-pre-emergency__input--valid');
  });

  it('normalizes a phone typed with a leading zero', async () => {
    const { controller } = setup();
    const user = await openPreEmergency(controller);
    const phone = screen.getByLabelText(preEmergencyCopy.phoneLabel);

    await user.type(phone, '0412 1301234');

    expect(phone).toHaveValue('412 1301234');
  });

  it('shows an error for an invalid phone after blur', async () => {
    const { controller } = setup();
    const user = await openPreEmergency(controller);
    const phone = screen.getByLabelText(preEmergencyCopy.phoneLabel);

    await user.type(phone, '3121301234');
    await user.tab();

    expect(screen.getByText(preEmergencyCopy.invalidPhone)).toBeInTheDocument();
    expect(phone.className).toContain(
      'emergency-pre-emergency__input--invalid',
    );
    expect(
      screen.getByRole('button', { name: copy.emergencyAria }),
    ).toBeDisabled();
  });

  it('stores the phone and starts activation when the valid form is submitted', async () => {
    const { controller } = setup();
    const user = await openPreEmergency(controller);

    await user.type(
      screen.getByLabelText(preEmergencyCopy.phoneLabel),
      '0412 1301234',
    );
    await user.click(screen.getByRole('button', { name: copy.emergencyAria }));

    await waitFor(() =>
      expect(controller.bff.activate).toHaveBeenCalledTimes(1),
    );
    expect(controller.client.getState().contactPhone).toBe('+584121301234');
  });

  it('submits with Enter when the phone is valid', async () => {
    const { controller } = setup();
    const user = await openPreEmergency(controller);

    await user.type(
      screen.getByLabelText(preEmergencyCopy.phoneLabel),
      '412 1301234{Enter}',
    );

    await waitFor(() =>
      expect(controller.bff.activate).toHaveBeenCalledTimes(1),
    );
  });

  it('returns to primary with Volver', async () => {
    const { controller } = setup();
    const user = await openPreEmergency(controller);

    await user.click(screen.getByRole('button', { name: copy.back }));

    expect(screenById('primary')).not.toBeNull();
    expect(screenById('pre-emergency')).toBeNull();
  });

  it('does not render the simulation action', async () => {
    const { controller } = setup();
    await openPreEmergency(controller);

    expect(
      screen.queryByRole('button', { name: copy.testAria }),
    ).not.toBeInTheDocument();
  });

  it('asks for the phone again after the panel is closed', async () => {
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
    const { controller: mountedController } = setup(controller);
    const user = await openPreEmergency(mountedController);

    await user.type(
      screen.getByLabelText(preEmergencyCopy.phoneLabel),
      '412 1301234',
    );
    await user.click(screen.getByRole('button', { name: copy.emergencyAria }));
    await screen.findByText(copy.geolocationDenied);
    await user.click(
      screen.getByRole('button', { name: copy.feedbackDismiss }),
    );
    await waitFor(() =>
      expect(mountedController.client.getState().contactPhone).not.toBeNull(),
    );

    await act(async () => {
      mountedController.client.close();
    });
    await act(async () => {
      mountedController.client.open();
    });
    await user.click(screen.getByRole('button', { name: copy.emergencyAria }));

    expect(screenById('pre-emergency')).not.toBeNull();
  });

  it('skips the phone screen when activation fails while the panel stays open', async () => {
    const getCurrentPosition = vi
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new Error('denied'), {
          emergencyError: createEmergencyError(
            'geolocation_denied',
            'Permission denied.',
          ),
        }),
      )
      .mockResolvedValue({ latitude: 4.711, longitude: -74.0721 });
    const { controller } = setup(
      createTestController({ geolocation: { getCurrentPosition } }),
    );
    const user = await openPreEmergency(controller);

    await user.type(
      screen.getByLabelText(preEmergencyCopy.phoneLabel),
      '412 1301234',
    );
    await user.click(screen.getByRole('button', { name: copy.emergencyAria }));
    await screen.findByText(copy.geolocationDenied);
    await user.click(
      screen.getByRole('button', { name: copy.feedbackDismiss }),
    );

    expect(screenById('primary')).not.toBeNull();
    expect(screenById('pre-emergency')).toBeNull();

    await user.click(screen.getByRole('button', { name: copy.emergencyAria }));

    await waitFor(() => expect(getCurrentPosition).toHaveBeenCalledTimes(2));
    expect(controller.bff.activate).toHaveBeenCalledTimes(1);
  });
});
