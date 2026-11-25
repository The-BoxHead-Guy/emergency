import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEmergencyError } from '@/core/errors';
import { copy } from '@/core/copy';
import type {
  BffClient,
  CreditHistoryResponse,
  CreditSummaryResponse,
} from '@/core/bff-types';
import type { EmergencyEventName } from '@/core/types';
import type { EmergencyResultPayload } from '@/core/bff-types';
import {
  activeEmergency,
  config,
  createFakeBff,
  createTestController,
  creditHistoryResponse,
  creditSummaryResponse,
  responders,
  type FakeBff,
} from '@/test/fakes';

afterEach(() => {
  vi.useRealTimers();
});

function controllerWithAbort(abort: FakeBff['abort']) {
  return createTestController({ bff: createFakeBff({ abort }) });
}

async function abortNow(controller: ReturnType<typeof createTestController>) {
  await controller.client.abort();
  await controller.client.abort();
}

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

  it('handles insufficient credits on activation with dedicated copy and fallback', async () => {
    const bff = createFakeBff({
      activate: vi.fn(async () => {
        throw createEmergencyError(
          'insufficient_credits',
          'The account has no credits.',
        );
      }),
    });
    const controller = createTestController({ bff });
    const fallback = vi.fn();
    controller.client.on('emergency:fallback', fallback);

    await controller.client.activate();

    const state = controller.client.getState();
    expect(state.phase.kind).toBe('ready');
    expect(state.lastError?.code).toBe('insufficient_credits');
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledWith({
      error: expect.objectContaining({ code: 'insufficient_credits' }),
      fallback: { phone: '+57 300 123 4567', label: 'Línea de emergencia' },
    });
  });

  it('renders insufficient credit copy on simulation without the fallback', async () => {
    const bff = createFakeBff({
      simulacrum: vi.fn(async () => {
        throw createEmergencyError(
          'insufficient_credits',
          'The account has no credits.',
        );
      }),
    });
    const controller = createTestController({ bff });
    const fallback = vi.fn();
    controller.client.on('emergency:fallback', fallback);

    await controller.client.simulate();

    const state = controller.client.getState();
    expect(state.phase.kind).toBe('ready');
    expect(state.simulationResult?.ok).toBe(false);
    expect(fallback).not.toHaveBeenCalled();
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
    expect(controller.bff.abort).toHaveBeenCalledTimes(1);
    expect(controller.bff.abort).toHaveBeenCalledWith('emg-1');
    expect(state.abortResult?.ok).toBe(true);
    expect(state.abortResult?.partial).toBe(false);
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

    await abortNow(controller);

    const state = controller.client.getState();
    expect(state.abortResult?.ok).toBe(false);
    expect(state.abortResult?.code).toBe('network');
    expect(state.phase.kind).toBe('active');
    expect(state.snapshot?.emergencyId).toBe('emg-1');
  });

  it('keeps the emergency active and reports insufficient credits on a billed abort', async () => {
    const controller = controllerWithAbort(
      vi.fn(async () => {
        throw createEmergencyError('insufficient_credits', 'No credits');
      }),
    );
    await controller.client.activate();

    await abortNow(controller);

    const state = controller.client.getState();
    expect(state.abortResult?.ok).toBe(false);
    expect(state.abortResult?.code).toBe('insufficient_credits');
    expect(state.phase.kind).toBe('active');
    expect(state.snapshot?.emergencyId).toBe('emg-1');
    expect(state.abortConfirmation).toBe(false);
  });

  it('reports a partial abort without claiming every contact was notified', async () => {
    const controller = controllerWithAbort(
      vi.fn(async () => ({
        emergency_id: 'emg-1',
        deleted: true,
        simulated: false,
        responders,
        failures: [
          { phone: '573007654321', message: 'Delivery failed', status: 502 },
        ],
      })),
    );
    await controller.client.activate();

    await abortNow(controller);

    const state = controller.client.getState();
    expect(state.abortResult?.ok).toBe(true);
    expect(state.abortResult?.partial).toBe(true);
    expect(state.abortResult?.message).not.toBe(copy.abortResultOk);
    expect(state.phase.kind).toBe('ready');
    expect(state.snapshot).toBeNull();
  });

  it('reports a total notification failure on a deleted abort', async () => {
    const failedResponders = responders.map((responder) => ({
      ...responder,
      sent: false,
      delivered: false,
      read: false,
      failed: true,
    }));
    const controller = controllerWithAbort(
      vi.fn(async () => ({
        emergency_id: 'emg-1',
        deleted: true,
        simulated: false,
        responders: failedResponders,
        failures: failedResponders.map((responder) => ({
          phone: responder.phone,
          message: 'Delivery failed',
          status: 502,
        })),
        total_failure: true,
      })),
    );
    await controller.client.activate();

    await abortNow(controller);

    const state = controller.client.getState();
    expect(state.abortResult?.ok).toBe(true);
    expect(state.abortResult?.partial).toBe(true);
    expect(state.abortResult?.message).not.toBe(copy.abortResultOk);
    expect(state.phase.kind).toBe('ready');
    expect(state.snapshot).toBeNull();
  });

  it('keeps the emergency active and syncs the snapshot when the BFF reports deleted: false', async () => {
    const failedResponders = responders.map((responder) => ({
      ...responder,
      failed: true,
    }));
    const controller = controllerWithAbort(
      vi.fn(async () => ({
        emergency_id: 'emg-1',
        deleted: false,
        simulated: false,
        responders: failedResponders,
        failures: [
          { phone: '573007654321', message: 'Delivery failed', status: 502 },
        ],
      })),
    );
    await controller.client.activate();

    await abortNow(controller);

    const state = controller.client.getState();
    expect(state.abortResult?.ok).toBe(false);
    expect(state.abortResult?.code).toBe('unknown');
    expect(state.phase.kind).toBe('active');
    expect(state.snapshot?.emergencyId).toBe('emg-1');
    expect(state.snapshot?.responders[0]?.failed).toBe(true);
    expect(state.failures).toHaveLength(1);
    expect(state.abortConfirmation).toBe(false);
  });

  it('clears a ghost emergency when abort reports emergency_not_found', async () => {
    const controller = controllerWithAbort(
      vi.fn(async () => {
        throw createEmergencyError('emergency_not_found', 'Already gone');
      }),
    );
    await controller.client.activate();

    await abortNow(controller);

    const state = controller.client.getState();
    expect(state.abortResult?.ok).toBe(true);
    expect(state.abortResult?.code).toBe('emergency_not_found');
    expect(state.phase.kind).toBe('ready');
    expect(state.snapshot).toBeNull();
    expect(controller.realtime.disconnect).toHaveBeenCalled();
  });

  it('can retry an abort after an ambiguous failure', async () => {
    const controller = controllerWithAbort(
      vi
        .fn<NonNullable<BffClient['abort']>>()
        .mockRejectedValueOnce(createEmergencyError('network', 'Timeout'))
        .mockResolvedValueOnce({
          emergency_id: 'emg-1',
          deleted: true,
          simulated: false,
          responders,
          failures: [],
        }),
    );
    await controller.client.activate();

    await abortNow(controller);

    expect(controller.client.getState().phase.kind).toBe('active');
    expect(controller.client.getState().snapshot?.emergencyId).toBe('emg-1');

    await abortNow(controller);

    const state = controller.client.getState();
    expect(controller.bff.abort).toHaveBeenCalledTimes(2);
    expect(state.abortResult?.ok).toBe(true);
    expect(state.phase.kind).toBe('ready');
    expect(state.snapshot).toBeNull();
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

  it('loads only the credit summary once the session becomes ready', async () => {
    const controller = createTestController();

    await controller.client.ensureSession();
    await vi.waitFor(() =>
      expect(controller.client.getState().credits.summaryStatus).toBe('ready'),
    );

    const initial = controller.client.getState();
    expect(controller.bff.credits).toHaveBeenCalledTimes(1);
    expect(controller.bff.creditHistory).not.toHaveBeenCalled();
    expect(initial.credits.credit?.balance).toBe(173);
    expect(initial.credits.credit?.rounds).toBe(57);
    expect(initial.credits.credit?.extraAlerts).toBe(2);
    expect(initial.credits.history).toEqual([]);
    expect(initial.credits.pagination).toBeNull();
    expect(initial.credits.summaryStatus).toBe('ready');
    expect(initial.credits.historyStatus).toBe('idle');

    await controller.client.loadCreditHistory(1);
    await vi.waitFor(() =>
      expect(controller.client.getState().credits.historyStatus).toBe('ready'),
    );

    const state = controller.client.getState();
    expect(controller.bff.creditHistory).toHaveBeenCalledWith({
      page: 1,
      perPage: undefined,
    });
    expect(state.credits.history).toHaveLength(4);
    expect(state.credits.history[0]?.rounds).toBe(57);
    expect(state.credits.pagination?.total).toBe(4);
  });

  it('refreshes the summary silently without flashing a loading state', async () => {
    const controller = createTestController();

    await controller.client.ensureSession();
    await vi.waitFor(() =>
      expect(controller.client.getState().credits.summaryStatus).toBe('ready'),
    );

    const previous = controller.client.getState().credits.credit;
    let resolveRequest: (value: CreditSummaryResponse) => void = () =>
      undefined;

    controller.bff.credits.mockReturnValueOnce(
      new Promise<CreditSummaryResponse>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const request = controller.client.refreshCredits({ silent: true });
    await Promise.resolve();

    expect(controller.client.getState().credits.summaryStatus).toBe('ready');
    expect(controller.client.getState().credits.credit).toEqual(previous);

    resolveRequest({
      credit: { ...creditSummaryResponse.credit, balance: 200 },
    });
    await request;

    const state = controller.client.getState();
    expect(state.credits.summaryStatus).toBe('ready');
    expect(state.credits.credit?.balance).toBe(200);
    expect(state.credits.error).toBeNull();
  });

  it('keeps the ready summary when a silent refresh fails', async () => {
    const controller = createTestController();

    await controller.client.ensureSession();
    await vi.waitFor(() =>
      expect(controller.client.getState().credits.summaryStatus).toBe('ready'),
    );

    const previous = controller.client.getState().credits.credit;
    controller.bff.credits.mockRejectedValueOnce(
      createEmergencyError('network', 'Offline'),
    );

    await controller.client.refreshCredits({ silent: true });

    const state = controller.client.getState();
    expect(state.credits.summaryStatus).toBe('ready');
    expect(state.credits.credit).toEqual(previous);
    expect(state.credits.error).toBeNull();
  });

  it('refreshes the history silently without flashing a loading state', async () => {
    const controller = createTestController();

    await controller.client.ensureSession();
    await controller.client.loadCreditHistory(1);
    await vi.waitFor(() =>
      expect(controller.client.getState().credits.historyStatus).toBe('ready'),
    );

    let resolveRequest: (value: CreditHistoryResponse) => void = () =>
      undefined;

    controller.bff.creditHistory.mockReturnValueOnce(
      new Promise<CreditHistoryResponse>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const request = controller.client.loadCreditHistory(1, undefined, {
      silent: true,
    });
    await Promise.resolve();

    expect(controller.client.getState().credits.historyStatus).toBe('ready');
    expect(controller.client.getState().credits.history).toHaveLength(4);

    resolveRequest({
      ...creditHistoryResponse,
      items: creditHistoryResponse.items.slice(0, 1),
    });
    await request;

    const state = controller.client.getState();
    expect(state.credits.historyStatus).toBe('ready');
    expect(state.credits.history).toHaveLength(1);
    expect(state.credits.error).toBeNull();
  });

  it('keeps the ready history when a silent refresh fails', async () => {
    const controller = createTestController();

    await controller.client.ensureSession();
    await controller.client.loadCreditHistory(1);
    await vi.waitFor(() =>
      expect(controller.client.getState().credits.historyStatus).toBe('ready'),
    );

    controller.bff.creditHistory.mockRejectedValueOnce(
      createEmergencyError('network', 'Offline'),
    );

    await controller.client.loadCreditHistory(1, undefined, { silent: true });

    const state = controller.client.getState();
    expect(state.credits.historyStatus).toBe('ready');
    expect(state.credits.history).toHaveLength(4);
    expect(state.credits.error).toBeNull();
  });

  it('reports an error when a silent history request has no data yet', async () => {
    const controller = createTestController();

    await controller.client.ensureSession();
    controller.bff.creditHistory.mockRejectedValueOnce(
      createEmergencyError('network', 'Offline'),
    );

    await controller.client.loadCreditHistory(1, undefined, { silent: true });

    const state = controller.client.getState();
    expect(state.credits.historyStatus).toBe('error');
    expect(state.credits.history).toEqual([]);
    expect(state.credits.error?.code).toBe('network');
  });

  it('coalesces overlapping history requests into one call', async () => {
    const controller = createTestController();
    let resolveRequest: (value: CreditHistoryResponse) => void = () =>
      undefined;

    await controller.client.ensureSession();
    controller.bff.creditHistory.mockReturnValueOnce(
      new Promise<CreditHistoryResponse>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const first = controller.client.loadCreditHistory(1);
    const second = controller.client.loadCreditHistory(1, undefined, {
      silent: true,
    });

    await vi.waitFor(() =>
      expect(controller.bff.creditHistory).toHaveBeenCalledTimes(1),
    );

    resolveRequest(creditHistoryResponse);
    await Promise.all([first, second]);

    expect(controller.bff.creditHistory).toHaveBeenCalledTimes(1);
    expect(controller.client.getState().credits.history).toHaveLength(4);
  });

  it('refreshes a loaded history after a successful simulation', async () => {
    const controller = createTestController();

    await controller.client.ensureSession();
    await controller.client.loadCreditHistory(1);
    controller.bff.creditHistory.mockClear();

    await controller.client.simulate();

    expect(controller.bff.creditHistory).toHaveBeenCalledTimes(1);
    expect(controller.bff.creditHistory).toHaveBeenCalledWith({
      page: 1,
      perPage: undefined,
    });
    expect(controller.client.getState().credits.historyStatus).toBe('ready');
  });

  it('refreshes a loaded history after a successful activation', async () => {
    const controller = createTestController();

    await controller.client.ensureSession();
    await controller.client.loadCreditHistory(1);
    controller.bff.creditHistory.mockClear();

    await controller.client.activate();

    expect(controller.bff.creditHistory).toHaveBeenCalledTimes(1);
    expect(controller.bff.creditHistory).toHaveBeenCalledWith({
      page: 1,
      perPage: undefined,
    });
  });

  it('refreshes a loaded history after a successful abort', async () => {
    const controller = createTestController();

    await controller.client.activate();
    await controller.client.loadCreditHistory(1);
    controller.bff.creditHistory.mockClear();

    await abortNow(controller);

    expect(controller.bff.creditHistory).toHaveBeenCalledTimes(1);
    expect(controller.bff.creditHistory).toHaveBeenCalledWith({
      page: 1,
      perPage: undefined,
    });
  });

  it('stores the latest history page after activation and abort', async () => {
    const freshTopUp: CreditHistoryResponse['items'][number] = {
      id: 99,
      type: 'recharge',
      amount: 5,
      balance_after: 178,
      contacts_count: 3,
      rounds: 58,
      extra_alerts: 2,
      emergency_id: null,
      reference: 'recharge:FRESH',
      created_at: '2026-11-24T09:30:00+00:00',
      status: 'read',
      status_timestamp: null,
      seen: true,
      ref: 'SYS-FRESH-1',
      reporter_phone: null,
      package: null,
    };
    const updatedHistory: CreditHistoryResponse = {
      ...creditHistoryResponse,
      items: [freshTopUp, ...creditHistoryResponse.items],
    };
    let historyCalls = 0;
    const bff = createFakeBff({
      creditHistory: vi.fn(async () => {
        historyCalls += 1;

        return historyCalls === 1 ? creditHistoryResponse : updatedHistory;
      }),
    });
    const controller = createTestController({ bff });

    await controller.client.ensureSession();
    await controller.client.loadCreditHistory(1);
    expect(controller.client.getState().credits.history[0]?.reference).toBe(
      'recharge:DEMO0001',
    );

    await controller.client.activate();
    expect(controller.client.getState().credits.history[0]?.reference).toBe(
      'recharge:FRESH',
    );

    await abortNow(controller);

    const state = controller.client.getState();
    expect(bff.creditHistory).toHaveBeenCalledTimes(3);
    expect(state.credits.history).toHaveLength(5);
    expect(state.credits.history[0]?.reference).toBe('recharge:FRESH');
  });

  it('does not request history from mutations when it was never loaded', async () => {
    const controller = createTestController();

    await controller.client.ensureSession();
    await controller.client.simulate();
    await controller.client.activate();
    await abortNow(controller);

    expect(controller.bff.creditHistory).not.toHaveBeenCalled();
    expect(controller.client.getState().credits.historyStatus).toBe('idle');
  });

  it('refreshes the credit summary when the panel opens', async () => {
    const controller = createTestController();

    await controller.client.ensureSession();
    controller.bff.credits.mockClear();

    controller.client.open();

    await vi.waitFor(() =>
      expect(controller.bff.credits).toHaveBeenCalledTimes(1),
    );
    expect(controller.client.getState().credits.summaryStatus).toBe('ready');
  });

  it('refreshes the credit summary after activate and abort', async () => {
    const controller = createTestController();

    await controller.client.activate();
    expect(controller.bff.credits).toHaveBeenCalledTimes(2);

    await controller.client.abort();
    await controller.client.abort();
    expect(controller.bff.credits).toHaveBeenCalledTimes(3);
  });

  it('refreshes the credit summary after a successful simulation', async () => {
    const controller = createTestController();

    await controller.client.simulate();

    expect(controller.bff.credits).toHaveBeenCalledTimes(2);
  });

  it('stores the requested history page and pagination', async () => {
    const bff = createFakeBff({
      creditHistory: vi.fn(async () => ({
        items: [],
        pagination: {
          total: 30,
          per_page: 5,
          current_page: 2,
          last_page: 6,
        },
      })),
    });
    const controller = createTestController({ bff });

    await controller.client.ensureSession();
    await controller.client.loadCreditHistory(2, 5);

    const state = controller.client.getState();
    expect(bff.creditHistory).toHaveBeenLastCalledWith({
      page: 2,
      perPage: 5,
    });
    expect(state.credits.pagination).toEqual({
      total: 30,
      perPage: 5,
      currentPage: 2,
      lastPage: 6,
    });
  });

  it('keeps credit failures out of the emergency phase and feedback', async () => {
    const bff = createFakeBff({
      credits: vi.fn(async () => {
        throw createEmergencyError('network', 'Offline');
      }),
      creditHistory: vi.fn(async () => {
        throw createEmergencyError('network', 'Offline');
      }),
    });
    const controller = createTestController({ bff });

    await controller.client.ensureSession();
    await controller.client.refreshCredits();
    await controller.client.loadCreditHistory(1);

    const state = controller.client.getState();
    expect(state.phase.kind).toBe('ready');
    expect(state.sessionReady).toBe(true);
    expect(state.lastError).toBeNull();
    expect(state.messages).toEqual([]);
    expect(state.credits.summaryStatus).toBe('error');
    expect(state.credits.historyStatus).toBe('error');
    expect(state.credits.error?.code).toBe('network');
    expect(state.credits.credit).toBeNull();
  });

  it('clears credit state on destroy', async () => {
    const controller = createTestController();

    await controller.client.ensureSession();
    controller.client.destroy();

    const state = controller.client.getState();
    expect(state.credits.credit).toBeNull();
    expect(state.credits.history).toEqual([]);
    expect(state.credits.pagination).toBeNull();
    expect(state.credits.summaryStatus).toBe('idle');
    expect(state.credits.historyStatus).toBe('idle');
    expect(state.credits.error).toBeNull();
  });
});
