import { describe, expect, it } from 'vitest';
import {
  isAbortResponse,
  isConfigResponse,
  isCurrentResponse,
  isEmergencyResultPayload,
  isErrorEnvelope,
  isRefreshResponse,
  isSessionResponse,
} from '@/core/guards';

const realtime = {
  mode: 'public',
  pusher: { key: 'k', cluster: 'us2', channel_pattern: 'whatsapp.{phone}' },
};

const responders = [
  {
    phone: '573001234567',
    name: 'Ana',
    sent: true,
    delivered: true,
    read: false,
    failed: false,
    message_id: 'm1',
  },
];

describe('BFF response guards', () => {
  it('accepts a valid config response', () => {
    expect(
      isConfigResponse({
        route_prefix: '/de-bff/emergency',
        realtime,
        csrf_token: 'token',
      }),
    ).toBe(true);
  });

  it('rejects config without a public pusher block', () => {
    expect(
      isConfigResponse({
        route_prefix: '/de-bff/emergency',
        realtime: { mode: 'private', pusher: {} },
        csrf_token: 'token',
      }),
    ).toBe(false);
  });

  it('validates session responses', () => {
    expect(
      isSessionResponse({ code: 'DABC12', csrf_token: 't', expires_in: 3600 }),
    ).toBe(true);
    expect(isSessionResponse({ code: 'DABC12', csrf_token: 't' })).toBe(false);
  });

  it('validates current responses for idle and active sessions', () => {
    expect(
      isCurrentResponse({ active: false, emergency: null, realtime }),
    ).toBe(true);
    expect(
      isCurrentResponse({
        active: true,
        emergency: { emergency_id: 'emg-1', is_active: true },
        realtime,
      }),
    ).toBe(true);
    expect(
      isCurrentResponse({ active: true, emergency: 'emg-1', realtime }),
    ).toBe(false);
  });

  it('validates activation results and failures', () => {
    const result = {
      emergency_id: 'emg-1',
      simulated: false,
      responders,
      failures: [{ phone: '573001234567', message: 'Failed' }],
    };

    expect(isEmergencyResultPayload(result)).toBe(true);
    expect(isEmergencyResultPayload({ ...result, responders: [{}] })).toBe(
      false,
    );
  });

  it('validates refresh and abort responses', () => {
    expect(
      isRefreshResponse({ emergency: { emergency_id: 'emg-1' }, responders }),
    ).toBe(true);
    expect(
      isAbortResponse({
        emergency_id: 'emg-1',
        deleted: true,
        simulated: false,
        responders,
        failures: [],
      }),
    ).toBe(true);
    expect(
      isAbortResponse({
        emergency_id: 'emg-1',
        simulated: false,
        responders,
        failures: [],
      }),
    ).toBe(false);
  });

  it('validates the BFF error envelope', () => {
    expect(
      isErrorEnvelope({
        error: {
          code: 'inactive_code',
          message: 'The code is inactive.',
          details: [],
          request_id: 'req-1',
        },
      }),
    ).toBe(true);
    expect(isErrorEnvelope({ error: { code: 'inactive_code' } })).toBe(false);
  });
});
