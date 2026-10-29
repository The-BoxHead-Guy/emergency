import { vi } from 'vitest';
import type {
  AbortResponse,
  BffClient,
  ConfigResponse,
  CurrentResponse,
  EmergencyResultPayload,
  RefreshResponse,
  ResponderPayload,
  SessionResponse,
} from '@/core/bff-types';
import {
  createEmergencyController,
  type EmergencyController,
  type EmergencyControllerDeps,
} from '@/core/controller';
import type { EmergencyConfig } from '@/core/types';
import type { RealtimeHandlers, RealtimeProvider } from '@/core/realtime';

export const realtimePayload = {
  mode: 'public' as const,
  pusher: {
    key: 'demo-key',
    cluster: 'us2',
    channel_pattern: 'whatsapp.{phone}',
  },
};

export const responders: ResponderPayload[] = [
  {
    phone: '573001234567',
    name: 'Ana Pérez',
    sent: true,
    delivered: true,
    read: false,
    failed: false,
    message_id: 'msg-1',
    sent_at: '2026-10-29T14:35:00.000Z',
    delivered_at: '2026-10-29T14:36:00.000Z',
    read_at: null,
    last_messages: [
      {
        content: 'Emergencia recibida, voy en camino.',
        sent_at: '2026-10-29T14:35:00.000Z',
      },
    ],
  },
  {
    phone: '573007654321',
    name: 'Carlos Ruiz',
    sent: true,
    delivered: false,
    read: false,
    failed: false,
    message_id: 'msg-2',
    sent_at: '2026-10-29T14:35:00.000Z',
    delivered_at: null,
    read_at: null,
    last_messages: [
      { content: 'Enterado.', sent_at: '2026-10-29T14:35:00.000Z' },
    ],
  },
];

export const activeEmergency = {
  emergency_id: 'emg-1',
  id: 'emg-1',
  is_active: true,
  initiator_id: 'DABC12',
  responders,
  created_at: '2026-10-28T10:00:00Z',
  updated_at: '2026-10-28T10:01:00Z',
};

export const config: EmergencyConfig = {
  bffBaseUrl: 'https://example.test/de-bff/emergency',
  code: 'DABC12',
  fallback: { phone: '+57 300 123 4567', label: 'Línea de emergencia' },
  geolocationTimeoutMs: 1000,
};

export interface FakeBff extends BffClient {
  config: ReturnType<typeof vi.fn<BffClient['config']>>;
  session: ReturnType<typeof vi.fn<BffClient['session']>>;
  current: ReturnType<typeof vi.fn<BffClient['current']>>;
  activate: ReturnType<typeof vi.fn<BffClient['activate']>>;
  simulacrum: ReturnType<typeof vi.fn<BffClient['simulacrum']>>;
  refresh: ReturnType<typeof vi.fn<BffClient['refresh']>>;
  abort: ReturnType<typeof vi.fn<BffClient['abort']>>;
  destroy: ReturnType<typeof vi.fn<BffClient['destroy']>>;
}

export function createFakeBff(overrides: Partial<BffClient> = {}): FakeBff {
  const defaults: BffClient = {
    config: vi.fn<BffClient['config']>(async (): Promise<ConfigResponse> => ({
      route_prefix: '/de-bff/emergency',
      realtime: realtimePayload,
      csrf_token: 'csrf-1',
    })),
    session: vi.fn<BffClient['session']>(
      async (): Promise<SessionResponse> => ({
        code: 'DABC12',
        csrf_token: 'csrf-2',
        expires_in: 3600,
      }),
    ),
    current: vi.fn<BffClient['current']>(
      async (): Promise<CurrentResponse> => ({
        active: false,
        emergency: null,
        realtime: realtimePayload,
      }),
    ),
    activate: vi.fn<BffClient['activate']>(
      async (): Promise<EmergencyResultPayload> => ({
        emergency_id: 'emg-1',
        simulated: false,
        responders,
        failures: [],
        partial_failure: false,
        total_failure: false,
      }),
    ),
    simulacrum: vi.fn<BffClient['simulacrum']>(
      async (): Promise<EmergencyResultPayload> => ({
        emergency_id: null,
        simulated: true,
        responders,
        failures: [],
        partial_failure: false,
        total_failure: false,
      }),
    ),
    refresh: vi.fn<BffClient['refresh']>(
      async (): Promise<RefreshResponse> => ({
        emergency: activeEmergency,
        responders,
      }),
    ),
    abort: vi.fn<BffClient['abort']>(async (): Promise<AbortResponse> => ({
      emergency_id: 'emg-1',
      deleted: true,
      simulated: false,
      responders,
      failures: [],
    })),
    destroy: vi.fn<BffClient['destroy']>(),
  };

  // Spreading `overrides` over the defaults erases the `vi.fn` Mock types, so
  // the merged object must be restored through an assertion.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const merged = { ...defaults, ...overrides } as FakeBff;

  return merged;
}

export interface FakeRealtime {
  provider: RealtimeProvider;
  handlers: RealtimeHandlers[];
  disconnect: ReturnType<typeof vi.fn>;
}

export function createFakeRealtime(): FakeRealtime {
  const handlers: RealtimeHandlers[] = [];
  const disconnect = vi.fn();

  return {
    handlers,
    disconnect,
    provider: {
      subscribe: (_config, _phones, nextHandlers) => {
        handlers.push(nextHandlers);

        return { disconnect };
      },
    },
  };
}

export function createTestController(
  overrides: Partial<EmergencyControllerDeps> & { bff?: FakeBff } = {},
): EmergencyController & { bff: FakeBff; realtime: FakeRealtime } {
  const bff: FakeBff = overrides.bff ?? createFakeBff();
  const realtime = createFakeRealtime();

  const controller = createEmergencyController({
    config,
    bff,
    geolocation: {
      getCurrentPosition: async () => ({
        latitude: 4.711,
        longitude: -74.0721,
      }),
    },
    realtime: realtime.provider,
    ...overrides,
  });

  return Object.assign(controller, { bff, realtime });
}
