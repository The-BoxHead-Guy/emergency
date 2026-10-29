import type { RealtimePublicConfig } from '@/core/bff-types';
import { createBffClient } from '@/core/bff-client';
import { isRecord } from '@/core/guards';
import { copy } from '@/core/copy';
import { createEmergencyError, toEmergencyError } from '@/core/errors';
import { createEventEmitter, type EmergencyEventEmitter } from '@/core/events';
import {
  createBrowserGeolocationProvider,
  type GeolocationProvider,
} from '@/core/geolocation';
import {
  payloadToSnapshot,
  resultToSnapshot,
  toFailure,
  toResponder,
} from '@/core/mappers';
import {
  createPusherRealtimeProvider,
  type RealtimeProvider,
  type RealtimeSubscription,
} from '@/core/realtime';
import { canTransition } from '@/core/state-machine';
import { createEmergencyStore, type EmergencyStore } from '@/core/store';
import type {
  AbortResult,
  EmergencyClient,
  EmergencyClientState,
  EmergencyConfig,
  EmergencyError,
  EmergencyOperation,
  EmergencyPhase,
  EmergencySnapshot,
  Message,
  MessageKind,
  PanelCloseReason,
  PanelOpenReason,
  RealtimeStatus,
  Responder,
  SimulationResult,
} from '@/core/types';

const MAX_MESSAGES = 20;
const RECONCILE_THROTTLE_MS = 1500;

export interface EmergencyControllerDeps {
  readonly config: EmergencyConfig;
  readonly bff?: ReturnType<typeof createBffClient>;
  readonly geolocation?: GeolocationProvider;
  readonly realtime?: RealtimeProvider;
  readonly events?: EmergencyEventEmitter;
}

export interface EmergencyController {
  readonly client: EmergencyClient;
  readonly store: EmergencyStore;
  readonly events: EmergencyEventEmitter;
}

interface FailOptions {
  /** `null` keeps the current phase; `undefined` moves to `error`. */
  readonly phase?: EmergencyPhase | null;
  /** `null` suppresses the message; `undefined` uses the error message. */
  readonly message?: string | null;
}

function geolocationFailure(error: unknown): EmergencyError {
  const attached = isRecord(error) ? error['emergencyError'] : undefined;

  if (attached) {
    return toEmergencyError(attached, 'geolocation_unavailable');
  }

  return toEmergencyError(error, 'geolocation_unavailable');
}

export function createEmergencyController(
  deps: EmergencyControllerDeps,
): EmergencyController {
  const config = deps.config;
  const bff =
    deps.bff ??
    createBffClient({
      bffBaseUrl: config.bffBaseUrl,
      timeoutMs: config.requestTimeoutMs,
    });
  const geolocation = deps.geolocation ?? createBrowserGeolocationProvider();
  const realtimeProvider = deps.realtime ?? createPusherRealtimeProvider();
  const events = deps.events ?? createEventEmitter();
  const store = createEmergencyStore(config);

  let sessionPromise: Promise<void> | null = null;
  let refreshing = false;
  let realtimeSubscription: RealtimeSubscription | null = null;
  let realtimeConfig: RealtimePublicConfig | null = null;
  let subscribedPhones: readonly string[] = [];
  let messageSequence = 0;
  let lastReconcileAt = 0;
  let reconcileTimer: ReturnType<typeof setTimeout> | null = null;

  const get = (): EmergencyClientState => store.getState();

  function patch(partial: Partial<EmergencyClientState>): void {
    store.setState(partial);
  }

  function transition(next: EmergencyPhase): boolean {
    const current = get().phase;

    if (current.kind === next.kind) {
      patch({ phase: next });

      return true;
    }

    if (!canTransition(current.kind, next.kind)) {
      events.emit('emergency:failed', {
        error: createEmergencyError(
          'invalid_transition',
          `Cannot move from ${current.kind} to ${next.kind}.`,
        ),
        operation: 'mount',
      });

      return false;
    }

    patch({ phase: next });

    return true;
  }

  function pushMessage(kind: MessageKind, text: string): void {
    messageSequence += 1;

    const message: Message = {
      id: `${Date.now()}-${messageSequence}`,
      kind,
      text,
      createdAt: Date.now(),
    };

    patch({ messages: [...get().messages, message].slice(-MAX_MESSAGES) });
  }

  function fail(
    error: EmergencyError,
    operation: EmergencyOperation,
    options: FailOptions = {},
  ): void {
    patch({ lastError: error });

    if (options.message !== null) {
      pushMessage('error', options.message ?? error.message);
    }

    if (options.phase !== null) {
      transition(options.phase ?? { kind: 'error', error });
    }

    events.emit('emergency:failed', { error, operation });
  }

  function emitFallback(error: EmergencyError): void {
    events.emit('emergency:fallback', {
      error,
      fallback: config.fallback ?? null,
    });
  }

  function stopRealtime(): void {
    realtimeSubscription?.disconnect();
    realtimeSubscription = null;
    subscribedPhones = [];
  }

  function startRealtime(
    realtime: RealtimePublicConfig | null,
    responders: readonly Responder[],
  ): void {
    if (!realtime) {
      return;
    }

    realtimeConfig = realtime;

    const phones = [...new Set(responders.map((responder) => responder.phone))];

    if (
      realtimeSubscription &&
      phones.length === subscribedPhones.length &&
      phones.every((phone, index) => phone === subscribedPhones[index])
    ) {
      return;
    }

    realtimeSubscription?.disconnect();
    subscribedPhones = phones;

    if (phones.length === 0) {
      patch({ realtimeStatus: 'unavailable' });

      return;
    }

    realtimeSubscription = realtimeProvider.subscribe(realtime, phones, {
      onStatus(status: RealtimeStatus) {
        const previous = get().realtimeStatus;
        patch({ realtimeStatus: status });

        if (status === 'connected' && previous !== 'connected') {
          scheduleReconcile();
        }
      },
      onEvent() {
        scheduleReconcile();
      },
    });

    if (!realtimeSubscription) {
      patch({ realtimeStatus: 'unavailable' });
    }
  }

  function scheduleReconcile(): void {
    if (reconcileTimer !== null) {
      return;
    }

    const wait = Math.max(
      0,
      RECONCILE_THROTTLE_MS - (Date.now() - lastReconcileAt),
    );

    reconcileTimer = setTimeout(() => {
      reconcileTimer = null;
      lastReconcileAt = Date.now();
      void refresh(true);
    }, wait);
  }

  async function performSession(): Promise<void> {
    const phase = get().phase.kind;

    if (phase === 'idle' || phase === 'error') {
      transition({ kind: 'initializing' });
    }

    try {
      // `/config` hands out the first CSRF token; the BFF rejects `POST /session`
      // without it. The same call carries the public realtime settings.
      const configuration = await bff.config();
      realtimeConfig = configuration.realtime;

      const session = await bff.session(config.code);

      patch({ sessionReady: true, lastError: null });

      if (get().phase.kind === 'initializing') {
        transition({ kind: 'ready' });
      }

      events.emit('session:ready', {
        code: session.code,
        expiresIn: session.expires_in,
      });
    } catch (error) {
      const normalized = toEmergencyError(error, 'network');
      patch({ sessionReady: false });
      fail(normalized, 'session', {
        phase: { kind: 'error', error: normalized },
      });
    }
  }

  async function ensureSession(): Promise<void> {
    if (get().destroyed || get().sessionReady) {
      return;
    }

    if (!sessionPromise) {
      sessionPromise = performSession().finally(() => {
        sessionPromise = null;
      });
    }

    return sessionPromise;
  }

  async function hydrateCurrent(): Promise<void> {
    try {
      const current = await bff.current();
      realtimeConfig = current.realtime;

      if (current.active && current.emergency) {
        const snapshot = payloadToSnapshot(current.emergency, {
          code: config.code,
        });

        patch({
          snapshot,
          responders: snapshot.responders,
          resumeAvailable: !get().panelOpen,
          failures: [],
          lastError: null,
          geolocationError: null,
        });
        transition({
          kind: 'active',
          emergencyId: snapshot.emergencyId,
          simulated: snapshot.simulated,
        });
        startRealtime(current.realtime, snapshot.responders);
        events.emit('emergency:resumed', { snapshot });

        return;
      }

      patch({ resumeAvailable: false, snapshot: null, responders: [] });

      if (get().phase.kind !== 'ready') {
        transition({ kind: 'ready' });
      }
    } catch (error) {
      const normalized = toEmergencyError(error, 'network');
      patch({ resumeAvailable: false });

      if (normalized.code === 'unauthenticated') {
        return;
      }

      fail(normalized, 'resume', {
        phase:
          get().phase.kind === 'active'
            ? null
            : { kind: 'error', error: normalized },
      });
    }
  }

  async function resume(): Promise<void> {
    if (get().destroyed) {
      return;
    }

    await ensureSession();

    if (!get().sessionReady) {
      return;
    }

    await hydrateCurrent();
  }

  async function activate(): Promise<void> {
    if (get().destroyed) {
      return;
    }

    const phase = get().phase.kind;

    if (phase === 'activating' || phase === 'active') {
      open('activate');

      return;
    }

    open('activate');
    await ensureSession();

    if (!get().sessionReady || !transition({ kind: 'activating' })) {
      return;
    }

    patch({ lastError: null, geolocationError: null, abortResult: null });

    let position;

    try {
      position = await geolocation.getCurrentPosition(
        config.geolocationTimeoutMs ?? 8000,
      );
      patch({ geolocation: position });
    } catch (error) {
      const normalized = geolocationFailure(error);
      patch({ geolocation: null, geolocationError: normalized });
      transition({ kind: 'ready' });
      pushMessage('error', normalized.message);
      events.emit('emergency:failed', {
        error: normalized,
        operation: 'geolocation',
      });
      emitFallback(normalized);

      return;
    }

    try {
      const result = await bff.activate({ geolocation: position });
      const snapshot = resultToSnapshot(result, config.code);
      const responders = result.responders.map(toResponder);
      const failures = result.failures.map(toFailure);
      const hydrated: EmergencySnapshot = { ...snapshot, responders };

      patch({
        snapshot: hydrated,
        responders,
        failures,
        resumeAvailable: false,
        lastError: null,
      });
      transition({
        kind: 'active',
        emergencyId: hydrated.emergencyId,
        simulated: result.simulated,
      });
      pushMessage(
        failures.length > 0 ? 'warning' : 'success',
        failures.length > 0 ? copy.partialFailure : copy.activeBanner,
      );
      events.emit('emergency:activated', { snapshot: hydrated });
      startRealtime(realtimeConfig, responders);
    } catch (error) {
      const normalized = toEmergencyError(error, 'network');

      if (normalized.code === 'emergency_already_active') {
        pushMessage('info', copy.emergencyActiveError);
        await hydrateCurrent();

        return;
      }

      fail(normalized, 'activate', { phase: { kind: 'ready' } });
      emitFallback(normalized);
    }
  }

  async function simulate(): Promise<void> {
    if (get().destroyed) {
      return;
    }

    const snapshot = get().snapshot;

    if (snapshot?.active && !snapshot.simulated) {
      pushMessage('warning', copy.emergencyActiveError);

      return;
    }

    if (['simulating', 'activating', 'aborting'].includes(get().phase.kind)) {
      return;
    }

    await ensureSession();

    if (!get().sessionReady || !transition({ kind: 'simulating' })) {
      return;
    }

    patch({ lastError: null, simulationResult: null });

    try {
      const result = await bff.simulacrum();
      const responders = result.responders.map(toResponder);
      const failures = result.failures.map(toFailure);
      const simulationResult: SimulationResult = {
        ok: true,
        message:
          failures.length > 0 ? copy.partialFailure : copy.simulateResultOk,
        at: Date.now(),
      };

      patch({
        responders,
        failures,
        simulationResult,
        simulationConfirmation: false,
      });
      transition({ kind: 'ready' });
      pushMessage(
        failures.length > 0 ? 'warning' : 'success',
        simulationResult.message,
      );
      events.emit('emergency:simulated', { responders, failures });
    } catch (error) {
      const normalized = toEmergencyError(error, 'network');
      const simulationResult: SimulationResult = {
        ok: false,
        message: copy.simulateResultFail,
        at: Date.now(),
      };

      patch({ simulationResult });
      transition({ kind: 'ready' });
      fail(normalized, 'simulate', { phase: null });
    }
  }

  async function refresh(silent = false): Promise<void> {
    const snapshot = get().snapshot;

    if (
      get().destroyed ||
      !snapshot ||
      snapshot.simulated ||
      snapshot.emergencyId === ''
    ) {
      return;
    }

    if (refreshing) {
      return;
    }

    refreshing = true;

    if (!silent) {
      transition({ kind: 'refreshing', emergencyId: snapshot.emergencyId });
    }

    try {
      const result = await bff.refresh(snapshot.emergencyId);
      const next = payloadToSnapshot(result.emergency, {
        code: config.code,
        simulated: snapshot.simulated,
      });
      const responders =
        result.responders.length > 0
          ? result.responders.map(toResponder)
          : next.responders.length > 0
            ? next.responders
            : get().responders;
      const updated: EmergencySnapshot = { ...next, responders };

      patch({ snapshot: updated, responders, lastError: null });

      if (get().phase.kind === 'refreshing') {
        transition({
          kind: 'active',
          emergencyId: updated.emergencyId,
          simulated: updated.simulated,
        });
      }

      startRealtime(realtimeConfig, responders);
      events.emit('emergency:updated', { snapshot: updated });
    } catch (error) {
      const normalized = toEmergencyError(error, 'network');

      if (get().phase.kind === 'refreshing') {
        transition({
          kind: 'active',
          emergencyId: snapshot.emergencyId,
          simulated: snapshot.simulated,
        });
      }

      fail(normalized, 'refresh', {
        phase: null,
        message: silent ? null : undefined,
      });
    } finally {
      refreshing = false;
    }
  }

  async function abort(): Promise<void> {
    if (get().destroyed) {
      return;
    }

    const snapshot = get().snapshot;

    if (get().phase.kind !== 'active' || !snapshot) {
      return;
    }

    if (!get().abortConfirmation) {
      patch({ abortConfirmation: true });

      return;
    }

    if (snapshot.simulated || snapshot.emergencyId === '') {
      patch({
        snapshot: null,
        responders: [],
        resumeAvailable: false,
        abortConfirmation: false,
      });
      transition({ kind: 'ready' });
      pushMessage('info', 'No hay una emergencia real activa.');

      return;
    }

    if (!transition({ kind: 'aborting', emergencyId: snapshot.emergencyId })) {
      return;
    }

    patch({ lastError: null, abortResult: null });

    try {
      const result = await bff.abort(snapshot.emergencyId);
      const responders = result.responders.map(toResponder);
      const abortResult: AbortResult = {
        ok: true,
        message: copy.abortResultOk,
        at: Date.now(),
      };

      patch({
        abortResult,
        responders,
        failures: result.failures.map(toFailure),
        abortConfirmation: false,
        snapshot: null,
        resumeAvailable: false,
      });
      stopRealtime();
      transition({ kind: 'ready' });
      pushMessage('success', abortResult.message);
      events.emit('emergency:aborted', {
        emergencyId: snapshot.emergencyId,
        responders,
      });
    } catch (error) {
      const normalized = toEmergencyError(error, 'network');
      const abortResult: AbortResult = {
        ok: false,
        message: copy.abortResultFail,
        at: Date.now(),
      };

      patch({ abortResult, abortConfirmation: false });
      transition({
        kind: 'active',
        emergencyId: snapshot.emergencyId,
        simulated: snapshot.simulated,
      });
      fail(normalized, 'abort', { phase: null });
    }
  }

  function open(reason: PanelOpenReason = 'manual'): void {
    if (get().destroyed) {
      return;
    }

    patch({ panelOpen: true, resumeAvailable: false });
    events.emit('panel:opened', { reason });
  }

  function close(reason: PanelCloseReason = 'close'): void {
    if (!get().panelOpen) {
      return;
    }

    patch({
      panelOpen: false,
      abortConfirmation: false,
      simulationConfirmation: false,
    });
    events.emit('panel:closed', { reason });
  }

  function reconcileNow(): void {
    const snapshot = get().snapshot;

    if (!snapshot || snapshot.simulated || snapshot.emergencyId === '') {
      return;
    }

    lastReconcileAt = Date.now();
    void refresh(true);
  }

  function onVisibilityChange(): void {
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible'
    ) {
      scheduleReconcile();
    }
  }

  function registerReconcileListeners(): () => void {
    if (typeof window === 'undefined') {
      return () => undefined;
    }

    window.addEventListener('focus', scheduleReconcile);
    window.addEventListener('online', reconcileNow);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      window.removeEventListener('focus', scheduleReconcile);
      window.removeEventListener('online', reconcileNow);

      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }

  const removeReconcileListeners = registerReconcileListeners();

  function destroy(): void {
    if (get().destroyed) {
      return;
    }

    removeReconcileListeners();

    if (reconcileTimer !== null) {
      clearTimeout(reconcileTimer);
      reconcileTimer = null;
    }

    bff.destroy();
    realtimeSubscription?.disconnect();
    realtimeSubscription = null;
    realtimeConfig = null;
    subscribedPhones = [];

    patch({
      destroyed: true,
      phase: { kind: 'idle' },
      panelOpen: false,
      sessionReady: false,
      resumeAvailable: false,
      snapshot: null,
      responders: [],
      failures: [],
      messages: [],
      lastError: null,
      geolocation: null,
      geolocationError: null,
      realtimeStatus: 'idle',
      abortResult: null,
      simulationResult: null,
      abortConfirmation: false,
      simulationConfirmation: false,
    });
    events.emit('panel:closed', { reason: 'destroy' });
    events.clear();
  }

  const client: EmergencyClient = {
    open,
    close,
    destroy,
    getState: get,
    subscribe: (listener) => store.subscribe(listener),
    on: (event, handler) => events.on(event, handler),
    off: (event, handler) => events.off(event, handler),
    ensureSession,
    resume,
    dismissResume: () => patch({ resumeAvailable: false }),
    activate,
    simulate,
    refresh: () => refresh(false),
    abort,
    requestAbortConfirmation: () => {
      if (get().phase.kind === 'active') {
        patch({ abortConfirmation: true });
      }
    },
    cancelAbortConfirmation: () => patch({ abortConfirmation: false }),
    requestSimulationConfirmation: () => {
      if (!get().snapshot?.active) {
        patch({ simulationConfirmation: true });
      }
    },
    cancelSimulationConfirmation: () =>
      patch({ simulationConfirmation: false }),
    dismissFeedback: () => patch({ abortResult: null, simulationResult: null }),
  };

  return { client, store, events };
}
