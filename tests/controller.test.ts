import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEmergencyError } from '@/core/errors';
import type { EmergencyEventName } from '@/core/types';
import type { EmergencyResultPayload } from '@/core/bff-types';
import {
  activeEmergency,
  config,
  createFakeBff,
  createTestController,
  responders,
} from '@/test/fakes';

afterEach(() => {
  vi.useRealTimers();
});

describe('emergency controller', () => {
  it('creates a session once and is safe to repeat', async () => {
    const controller = createTestController();

    await Promise.all([
      controller.client.ensureSession(),
      controller.client.ensureSession(),
      controller.client.ensureSession(),
    ]);
    await controller.client.ensureSession();

    expect(controller.bff.config).toHaveBeenCalledTimes(1);
    expect(controller.bff.session).toHaveBeenCalledTimes(1);
    expect(controller.client.getState().sessionReady).toBe(true);
    expect(controller.client.getState().phase.kind).toBe('ready');
  });

  it('hydrates an existing emergency on resume without localStorage', async () => {
    const bff = createFakeBff({
      current: vi.fn(async () => ({
        active: true,
        emergency: activeEmergency,
      })),
    });
    const controller = createTestController({ bff });
    const resumed = vi.fn();
    controller.client.on('emergency:resumed', resumed);

    await controller.client.resume();

    const state = controller.client.getState();
    expect(state.snapshot?.emergencyId).toBe('emg-1');
    expect(state.responders).toHaveLength(2);
    expect(state.resumeAvailable).toBe(true);
    expect(state.panelOpen).toBe(false);
    expect(state.phase.kind).toBe('active');
    expect(resumed).toHaveBeenCalledTimes(1);
    expect(controller.realtime.handlers).toHaveLength(1);
  });

  it('subscribes from the mount realtime config on activation', async () => {
    const controller = createTestController();

    await controller.client.activate();

    expect(controller.realtime.handlers).toHaveLength(1);
  });

  it('stays in pull mode when no realtime config is supplied', async () => {
    const controller = createTestController({
      config: { ...config, realtime: undefined },
    });

    await controller.client.activate();

    expect(controller.realtime.handlers).toHaveLength(0);
    expect(controller.client.getState().realtimeStatus).toBe('unavailable');
  });

  it('opens the panel immediately and activates after geolocation', async () => {
    const controller = createTestController();
    const opened = vi.fn();
    controller.client.on('panel:opened', opened);

    await controller.client.activate();

    const state = controller.client.getState();
    expect(opened).toHaveBeenCalledWith({ reason: 'activate' });
    expect(controller.bff.activate).toHaveBeenCalledWith({
      geolocation: { latitude: 4.711, longitude: -74.0721 },
    });
    expect(state.panelOpen).toBe(true);
    expect(state.phase.kind).toBe('active');
    expect(state.snapshot?.emergencyId).toBe('emg-1');
    expect(state.responders.map((responder) => responder.status)).toEqual([
      'delivered',
      'sent',
    ]);
  });

  it('sends the captured contact phone as reporter_phone on activation', async () => {
    const controller = createTestController();
    controller.client.open();
    controller.client.setContactPhone('+584121301234');

    await controller.client.activate();

    expect(controller.bff.activate).toHaveBeenCalledWith({
      geolocation: { latitude: 4.711, longitude: -74.0721 },
      reporter_phone: '+584121301234',
    });
  });

  it('omits reporter_phone when no contact phone was captured', async () => {
    const controller = createTestController();

    await controller.client.activate();

    expect(controller.bff.activate.mock.calls[0]?.[0]).toEqual({
      geolocation: { latitude: 4.711, longitude: -74.0721 },
    });
  });

  it('exposes the reporter phone from a resumed emergency', async () => {
    const bff = createFakeBff({
      current: vi.fn(async () => ({
        active: true,
        emergency: { ...activeEmergency, reporter_phone: '+584121301234' },
      })),
    });
    const controller = createTestController({ bff });

    await controller.client.resume();

    expect(controller.client.getState().snapshot?.reporterPhone).toBe(
      '+584121301234',
    );
  });

  it('updates the reporter phone on refresh', async () => {
    const bff = createFakeBff({
      refresh: vi.fn(async () => ({
        emergency: { ...activeEmergency, reporter_phone: '+584121301234' },
      })),
    });
    const controller = createTestController({ bff });

    await controller.client.activate();
    await controller.client.refresh();

    expect(controller.client.getState().snapshot?.reporterPhone).toBe(
      '+584121301234',
    );
  });

  it('falls back to the captured contact phone when activation omits it', async () => {
    const controller = createTestController();
    controller.client.open();
    controller.client.setContactPhone('+584121301234');

    await controller.client.activate();

    expect(controller.client.getState().snapshot?.reporterPhone).toBe(
      '+584121301234',
    );
  });

  it('ignores a second activation while one is in flight', async () => {
    let resolveActivation: (value: EmergencyResultPayload) => void = () =>
      undefined;
    const bff = createFakeBff({
      activate: vi.fn((): Promise<EmergencyResultPayload> => {
        return new Promise((resolve) => {
          resolveActivation = resolve;
        });
      }),
    });
    const controller = createTestController({ bff });

    const first = controller.client.activate();
    await vi.waitFor(() => expect(bff.activate).toHaveBeenCalledTimes(1));

    await controller.client.activate();
    expect(bff.activate).toHaveBeenCalledTimes(1);

    resolveActivation({
      emergency_id: 'emg-1',
      simulated: false,
      responders,
      failures: [],
    });
    await first;
    expect(controller.client.getState().phase.kind).toBe('active');
  });

  it('does not activate when geolocation fails and surfaces the fallback', async () => {
    const fallback = vi.fn();
    const geolocation = {
      getCurrentPosition: vi.fn(async () => {
        throw Object.assign(new Error('denied'), {
          emergencyError: createEmergencyError(
            'geolocation_denied',
            'Permission denied.',
          ),
        });
      }),
    };
    const controller = createTestController({ geolocation });
    controller.client.on('emergency:fallback', fallback);

    await controller.client.activate();

    const state = controller.client.getState();
    expect(controller.bff.activate).not.toHaveBeenCalled();
    expect(state.geolocationError?.code).toBe('geolocation_denied');
    expect(state.phase.kind).toBe('ready');
    expect(fallback).toHaveBeenCalledWith({
      error: expect.objectContaining({ code: 'geolocation_denied' }),
      fallback: { phone: '+57 300 123 4567', label: 'Línea de emergencia' },
    });
  });

  it('clears the latent geolocation error when its feedback is dismissed', async () => {
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

    await controller.client.activate();
    controller.client.dismissFeedback();

    expect(controller.client.getState().geolocationError).toBeNull();
  });

  it('shows the fallback when activation fails', async () => {
    const bff = createFakeBff({
      activate: vi.fn(async () => {
        throw createEmergencyError(
          'whatsapp_delivery_failed',
          'No message could be sent.',
        );
      }),
    });
    const controller = createTestController({ bff });
    const fallback = vi.fn();
    controller.client.on('emergency:fallback', fallback);

    await controller.client.activate();

    expect(controller.client.getState().phase.kind).toBe('ready');
    expect(controller.client.getState().lastError?.code).toBe(
      'whatsapp_delivery_failed',
    );
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it('simulates without creating an emergency', async () => {
    const controller = createTestController();
    const simulated = vi.fn();
    controller.client.on('emergency:simulated', simulated);

    await controller.client.simulate();

    const state = controller.client.getState();
    expect(controller.bff.simulacrum).toHaveBeenCalledTimes(1);
    expect(controller.bff.simulacrum).toHaveBeenCalledWith({
      geolocation: { latitude: 4.711, longitude: -74.0721 },
    });
    expect(controller.bff.activate).not.toHaveBeenCalled();
    expect(state.snapshot).toBeNull();
    expect(state.phase.kind).toBe('ready');
    expect(state.geolocation).toEqual({
      latitude: 4.711,
      longitude: -74.0721,
    });
    expect(state.simulationResult?.ok).toBe(true);
    expect(simulated).toHaveBeenCalledWith({
      responders: expect.any(Array),
      failures: [],
      geolocation: { latitude: 4.711, longitude: -74.0721 },
    });
  });

  it('emits emergency:location after capturing geolocation', async () => {
    const controller = createTestController();
    const located = vi.fn();
    const activated = vi.fn();
    controller.client.on('emergency:location', located);
    controller.client.on('emergency:activated', activated);

    await controller.client.activate();

    expect(located).toHaveBeenCalledWith({
      geolocation: { latitude: 4.711, longitude: -74.0721 },
    });
    expect(activated).toHaveBeenCalledWith({
      snapshot: expect.objectContaining({ emergencyId: 'emg-1' }),
      geolocation: { latitude: 4.711, longitude: -74.0721 },
    });
  });

  it('does not simulate when geolocation fails and surfaces the fallback', async () => {
    const fallback = vi.fn();
    const failed = vi.fn();
    const geolocation = {
      getCurrentPosition: vi.fn(async () => {
        throw Object.assign(new Error('denied'), {
          emergencyError: createEmergencyError(
            'geolocation_denied',
            'Permission denied.',
          ),
        });
      }),
    };
    const controller = createTestController({ geolocation });
    controller.client.on('emergency:fallback', fallback);
    controller.client.on('emergency:failed', failed);

    await controller.client.simulate();

    const state = controller.client.getState();
    expect(controller.bff.simulacrum).not.toHaveBeenCalled();
    expect(state.geolocation).toBeNull();
    expect(state.geolocationError?.code).toBe('geolocation_denied');
    expect(state.phase.kind).toBe('ready');
    expect(failed).toHaveBeenCalledWith({
      error: expect.objectContaining({ code: 'geolocation_denied' }),
      operation: 'geolocation',
    });
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it('ignores a second simulation while one is in flight', async () => {
    let resolveSimulation: (value: EmergencyResultPayload) => void = () =>
      undefined;
    const bff = createFakeBff({
      simulacrum: vi.fn((): Promise<EmergencyResultPayload> => {
        return new Promise((resolve) => {
          resolveSimulation = resolve;
        });
      }),
    });
    const controller = createTestController({ bff });

    const first = controller.client.simulate();
    await vi.waitFor(() => expect(bff.simulacrum).toHaveBeenCalledTimes(1));

    await controller.client.simulate();
    expect(bff.simulacrum).toHaveBeenCalledTimes(1);

    resolveSimulation({
      emergency_id: null,
      simulated: true,
      responders,
      failures: [],
    });
    await first;
    expect(controller.client.getState().phase.kind).toBe('ready');
  });

  it('dismisses a failed simulation without keeping its error surface', async () => {
    const bff = createFakeBff({
      simulacrum: vi.fn(async () => {
        throw createEmergencyError('upstream_error', 'Simulation failed.');
      }),
    });
    const controller = createTestController({ bff });

    await controller.client.simulate();

    expect(controller.client.getState().simulationResult?.ok).toBe(false);
    expect(controller.client.getState().lastError).not.toBeNull();

    controller.client.dismissFeedback();

    const state = controller.client.getState();
    expect(state.simulationResult).toBeNull();
    expect(state.lastError).toBeNull();
  });

  it('blocks simulation while a real emergency is active', async () => {
    const controller = createTestController();
    await controller.client.activate();

    await controller.client.simulate();

    expect(controller.bff.simulacrum).not.toHaveBeenCalled();
    expect(controller.client.getState().messages.at(-1)?.kind).toBe('warning');
  });

  it('requires confirmation before aborting and stores the result', async () => {
    const controller = createTestController();
    await controller.client.activate();

    await controller.client.abort();
    expect(controller.bff.abort).not.toHaveBeenCalled();
    expect(controller.client.getState().abortConfirmation).toBe(true);

    await controller.client.abort();

    const state = controller.client.getState();
    expect(controller.bff.abort).toHaveBeenCalledWith('emg-1');
    expect(state.abortResult?.ok).toBe(true);
    expect(state.phase.kind).toBe('ready');
    expect(state.snapshot).toBeNull();
    expect(controller.realtime.disconnect).toHaveBeenCalled();
  });

  it('keeps the emergency active when the abort fails', async () => {
    const bff = createFakeBff({
      abort: vi.fn(async () => {
        throw createEmergencyError('network', 'Offline');
      }),
    });
    const controller = createTestController({ bff });
    await controller.client.activate();

    await controller.client.abort();
    await controller.client.abort();

    const state = controller.client.getState();
    expect(state.abortResult?.ok).toBe(false);
    expect(state.phase.kind).toBe('active');
    expect(state.snapshot?.emergencyId).toBe('emg-1');
  });

  it('reconciles after the realtime connection is restored', async () => {
    vi.useFakeTimers();
    const controller = createTestController();
    await controller.client.activate();

    const handlers = controller.realtime.handlers.at(-1);
    handlers?.onStatus('connected');
    await vi.advanceTimersByTimeAsync(1600);

    expect(controller.bff.refresh).toHaveBeenCalledWith('emg-1');
  });

  it('takes refreshed responders from the emergency payload', async () => {
    const bff = createFakeBff({
      refresh: vi.fn(async () => ({
        emergency: {
          ...activeEmergency,
          responders: [{ ...responders[0], read: true }],
        },
      })),
    });
    const controller = createTestController({ bff });

    await controller.client.activate();
    await controller.client.refresh();

    expect(
      controller.client
        .getState()
        .responders.map((responder) => responder.status),
    ).toEqual(['read']);
  });

  it('emits typed events through its own emitter', async () => {
    const controller = createTestController();
    const seen: EmergencyEventName[] = [];
    const listener = <T extends EmergencyEventName>(name: T) => seen.push(name);

    controller.client.on('session:ready', () => listener('session:ready'));
    controller.client.on('emergency:activated', () =>
      listener('emergency:activated'),
    );
    controller.client.on('panel:opened', () => listener('panel:opened'));

    await controller.client.activate();

    expect(seen).toEqual([
      'panel:opened',
      'session:ready',
      'emergency:activated',
    ]);
  });

  it('keeps the contact phone for the current panel session and clears it on close', () => {
    const controller = createTestController();
    controller.client.open();

    controller.client.setContactPhone('+584121301234');

    expect(controller.client.getState().contactPhone).toBe('+584121301234');

    controller.client.close();

    expect(controller.client.getState().contactPhone).toBeNull();
  });

  it('clears the contact phone on destroy', async () => {
    const controller = createTestController();
    await controller.client.activate();
    controller.client.setContactPhone('+584121301234');

    controller.client.destroy();

    expect(controller.client.getState().contactPhone).toBeNull();
  });

  it('tears down requests, realtime and state on destroy', async () => {
    const controller = createTestController();
    await controller.client.activate();

    controller.client.destroy();

    const state = controller.client.getState();
    expect(controller.bff.destroy).toHaveBeenCalledTimes(1);
    expect(controller.realtime.disconnect).toHaveBeenCalled();
    expect(state.destroyed).toBe(true);
    expect(state.snapshot).toBeNull();
    expect(state.messages).toEqual([]);
  });
});
