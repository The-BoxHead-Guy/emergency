import { createRoot, type Root } from 'react-dom/client';
import { createEmergencyController } from '@/core/controller';
import { validateConfig } from '@/core/config';
import { createEmergencyError } from '@/core/errors';
import { EMERGENCY_EVENT_NAMES } from '@/core/events';
import { EmergencyRoot } from '@/react/components/EmergencyRoot';
import { EmergencyProvider } from '@/react/context';
import type {
  EmergencyClient,
  EmergencyClientState,
  EmergencyError,
  EmergencyEventName,
  EmergencyMountOptions,
  EmergencyTrigger,
} from '@/core/types';

function resolveRoot(root: HTMLElement | string): HTMLElement | null {
  if (typeof root === 'string') {
    if (typeof document === 'undefined') {
      return null;
    }

    return document.querySelector<HTMLElement>(root);
  }

  return root instanceof HTMLElement ? root : null;
}

function createFailedClient(error: EmergencyError): EmergencyClient {
  const state: EmergencyClientState = {
    config: {
      bffBaseUrl: '',
      code: '',
    },
    phase: { kind: 'error', error },
    panelOpen: false,
    sessionReady: false,
    resumeAvailable: false,
    snapshot: null,
    responders: [],
    failures: [],
    messages: [],
    lastError: error,
    geolocation: null,
    geolocationError: null,
    realtimeStatus: 'idle',
    abortResult: null,
    simulationResult: null,
    abortConfirmation: false,
    simulationConfirmation: false,
    destroyed: false,
  };

  const noop = (): void => undefined;
  const noopAsync = async (): Promise<void> => undefined;

  return {
    open: noop,
    close: noop,
    destroy: noop,
    getState: () => state,
    subscribe: () => () => undefined,
    on: () => () => undefined,
    off: noop,
    ensureSession: noopAsync,
    resume: noopAsync,
    dismissResume: noop,
    activate: noopAsync,
    simulate: noopAsync,
    refresh: noopAsync,
    abort: noopAsync,
    requestAbortConfirmation: noop,
    cancelAbortConfirmation: noop,
    requestSimulationConfirmation: noop,
    cancelSimulationConfirmation: noop,
    dismissFeedback: noop,
  };
}

function attachTrigger(
  trigger: EmergencyTrigger | undefined,
  client: EmergencyClient,
): () => void {
  if (!trigger) {
    return () => undefined;
  }

  if (typeof trigger === 'function') {
    const cleanup = trigger(() => client.open());

    return typeof cleanup === 'function' ? cleanup : () => undefined;
  }

  const element =
    typeof trigger === 'string'
      ? typeof document === 'undefined'
        ? null
        : document.querySelector<HTMLElement>(trigger)
      : trigger;

  if (!element) {
    return () => undefined;
  }

  const listener = (event: Event): void => {
    event.preventDefault();
    client.open();
  };

  element.addEventListener('click', listener);

  return () => {
    element.removeEventListener('click', listener);
  };
}

function reportConfigurationError(
  error: EmergencyError,
  options: EmergencyMountOptions,
): EmergencyClient {
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error('[emergency]', error.message);
  }

  options.onEvent?.('emergency:failed', { error, operation: 'mount' });

  return createFailedClient(error);
}

/**
 * Mounts the emergency client into a host element. Validation failures never
 * throw into the host page: they produce a typed configuration error, a console
 * message, and an inert client.
 */
export function mount(options: EmergencyMountOptions): EmergencyClient {
  if (typeof document === 'undefined') {
    return reportConfigurationError(
      createEmergencyError(
        'configuration',
        'mount() requires a browser environment.',
      ),
      options,
    );
  }

  const root = resolveRoot(options.root);

  if (!root) {
    return reportConfigurationError(
      createEmergencyError(
        'configuration',
        `The mount root "${
          typeof options.root === 'string' ? options.root : 'element'
        }" was not found.`,
      ),
      options,
    );
  }

  const validation = validateConfig(options);

  if (!validation.ok || !validation.config) {
    return reportConfigurationError(
      validation.error ??
        createEmergencyError(
          'configuration',
          'Invalid emergency configuration.',
        ),
      options,
    );
  }

  const config = validation.config;
  const controller = createEmergencyController({ config });
  const container = document.createElement('div');
  container.setAttribute('data-de-emergency-container', '');
  root.appendChild(container);
  const reactRoot: Root = createRoot(container);

  reactRoot.render(
    <EmergencyProvider
      value={{ store: controller.store, client: controller.client, config }}
    >
      <EmergencyRoot />
    </EmergencyProvider>,
  );

  const detachTrigger = attachTrigger(options.trigger, controller.client);
  const unsubscribers = options.onEvent
    ? EMERGENCY_EVENT_NAMES.map((name) =>
        controller.events.on(name, (payload) => {
          // The subscription loses the per-event generic signature, so the
          // payload must be restored through an assertion to forward it to the
          // host listener unchanged.
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          options.onEvent?.(name as EmergencyEventName, payload as never);
        }),
      )
    : [];

  let destroyed = false;

  void controller.client.resume();

  const destroy = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    detachTrigger();

    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }

    controller.client.destroy();
    container.remove();
    // Deferring avoids React's "synchronously unmount a root while rendering"
    // warning when a host calls destroy() from an effect cleanup.
    queueMicrotask(() => reactRoot.unmount());
  };

  const client = controller.client;

  return {
    open: (reason) => client.open(reason ?? 'manual'),
    close: (reason) => client.close(reason ?? 'manual'),
    getState: () => client.getState(),
    subscribe: (listener) => client.subscribe(listener),
    on: (event, handler) => client.on(event, handler),
    off: (event, handler) => client.off(event, handler),
    ensureSession: () => client.ensureSession(),
    resume: () => client.resume(),
    dismissResume: () => client.dismissResume(),
    activate: () => client.activate(),
    simulate: () => client.simulate(),
    refresh: () => client.refresh(),
    abort: () => client.abort(),
    requestAbortConfirmation: () => client.requestAbortConfirmation(),
    cancelAbortConfirmation: () => client.cancelAbortConfirmation(),
    requestSimulationConfirmation: () => client.requestSimulationConfirmation(),
    cancelSimulationConfirmation: () => client.cancelSimulationConfirmation(),
    dismissFeedback: () => client.dismissFeedback(),
    destroy,
  };
}
