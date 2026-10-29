import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { describe, expect, it } from 'vitest';
import { createBffAxiosInstance, createBffClient } from '@/core/bff-client';
import { isRecord } from '@/core/guards';

function createInstance(
  handler: (
    config: InternalAxiosRequestConfig,
  ) => Promise<AxiosResponse> | AxiosResponse,
) {
  const calls: InternalAxiosRequestConfig[] = [];
  const instance = axios.create({
    adapter: async (config) => {
      calls.push(config);

      return handler(config);
    },
  });

  return { instance, calls };
}

function response(
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
): AxiosResponse {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config,
  };
}

const realtime = {
  mode: 'public',
  pusher: { key: 'k', cluster: 'us2', channel_pattern: 'whatsapp.{phone}' },
};

describe('createBffClient', () => {
  it('captures the CSRF token from /config and sends it on /session', async () => {
    const { instance, calls } = createInstance((config) => {
      if (config.url === '/config') {
        return response(config, {
          route_prefix: '/de-bff/emergency',
          realtime,
          csrf_token: 'csrf-1',
        });
      }

      return response(
        config,
        { code: 'DABC12', csrf_token: 'csrf-2', expires_in: 3600 },
        201,
      );
    });

    const client = createBffClient({
      bffBaseUrl: 'https://example.test',
      axiosInstance: instance,
    });

    await client.config();
    await client.session('DABC12');

    expect(calls).toHaveLength(2);
    expect(calls[0]?.url).toBe('/config');
    expect(calls[1]?.headers.get('X-CSRF-Token')).toBe('csrf-1');
    expect(calls[1]?.data).toBe(JSON.stringify({ code: 'DABC12' }));
  });

  it('rejects responses that do not match the contract', async () => {
    const { instance } = createInstance((config) =>
      response(config, { active: 'yes' }),
    );
    const client = createBffClient({
      bffBaseUrl: 'https://example.test',
      axiosInstance: instance,
    });

    await expect(client.current()).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('normalizes a BFF error envelope with status and request id', async () => {
    const error = new AxiosError('Conflict', 'ERR_BAD_REQUEST');
    error.response = {
      data: {
        error: {
          code: 'emergency_already_active',
          message: 'An emergency is already active.',
          details: [],
          request_id: 'req-9',
        },
      },
      status: 409,
      statusText: 'Conflict',
      headers: new AxiosHeaders({ 'x-request-id': 'req-header' }),
      config: { headers: new AxiosHeaders() },
    };

    const { instance } = createInstance(() => Promise.reject(error));
    const client = createBffClient({
      bffBaseUrl: 'https://example.test',
      axiosInstance: instance,
    });

    await expect(client.activate({})).rejects.toMatchObject({
      code: 'emergency_already_active',
      status: 409,
      requestId: 'req-9',
    });
  });

  it('maps a transport failure to a network error', async () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK');
    const { instance } = createInstance(() => Promise.reject(error));
    const client = createBffClient({
      bffBaseUrl: 'https://example.test',
      axiosInstance: instance,
    });

    await expect(client.current()).rejects.toMatchObject({ code: 'network' });
  });

  it('sends geolocation and a generated idempotency key on activation', async () => {
    const { instance, calls } = createInstance((config) =>
      response(
        config,
        {
          emergency_id: 'emg-1',
          simulated: false,
          responders: [],
          failures: [],
        },
        201,
      ),
    );

    const client = createBffClient({
      bffBaseUrl: 'https://example.test',
      axiosInstance: instance,
      generateIdempotencyKey: () => 'idem-1',
    });

    await client.activate({
      geolocation: { latitude: 4.711, longitude: -74.0721 },
    });

    expect(calls[0]?.headers.get('Idempotency-Key')).toBe('idem-1');
    expect(calls[0]?.data).toBe(
      JSON.stringify({ geolocation: { latitude: 4.711, longitude: -74.0721 } }),
    );
  });

  it('rejects calls after destroy', async () => {
    const { instance } = createInstance((config) =>
      response(config, { active: false, emergency: null, realtime }),
    );
    const client = createBffClient({
      bffBaseUrl: 'https://example.test',
      axiosInstance: instance,
    });

    client.destroy();

    await expect(client.current()).rejects.toMatchObject({ code: 'destroyed' });
  });

  it('reports cancellation as a typed error', async () => {
    const controller = new AbortController();
    controller.abort();
    const { instance } = createInstance(() =>
      Promise.reject(new AxiosError('canceled', 'ERR_CANCELED')),
    );
    const client = createBffClient({
      bffBaseUrl: 'https://example.test',
      axiosInstance: instance,
    });

    await expect(client.current(controller.signal)).rejects.toMatchObject({
      code: 'cancelled',
    });
  });

  it('disables redirects by default', () => {
    const instance = createBffAxiosInstance({
      bffBaseUrl: 'https://example.test',
    });

    expect(instance.defaults.maxRedirects).toBe(0);
    expect(
      createBffAxiosInstance({
        bffBaseUrl: 'https://example.test',
        maxRedirects: 2,
      }).defaults.maxRedirects,
    ).toBe(2);
  });

  it('bounds the details attached to an invalid response', async () => {
    const { instance } = createInstance((config) =>
      response(config, {
        active: 'yes',
        responders: Array.from({ length: 40 }, (_, index) => ({
          phone: `${index}`.repeat(300),
        })),
      }),
    );
    const client = createBffClient({
      bffBaseUrl: 'https://example.test',
      axiosInstance: instance,
    });

    const error: unknown = await client
      .current()
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: 'invalid_response' });

    if (
      !isRecord(error) ||
      !isRecord(error['details']) ||
      !Array.isArray(error['details']['responders'])
    ) {
      throw new Error(
        'expected redacted details on the invalid_response error',
      );
    }

    const responders: unknown[] = error['details']['responders'];
    const first: unknown = responders[0];

    expect(responders).toHaveLength(20);
    expect(isRecord(first) ? first['phone'] : null).toHaveLength(201);
    expect(
      isRecord(first) && typeof first['phone'] === 'string'
        ? first['phone'].endsWith('…')
        : false,
    ).toBe(true);
  });
});
