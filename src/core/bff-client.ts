import axios, {
  isAxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';
import type {
  AbortResponse,
  ActivateRequest,
  BffClient,
  ConfigResponse,
  CurrentResponse,
  EmergencyResultPayload,
  RefreshResponse,
  SessionResponse,
} from '@/core/bff-types';
import { createEmergencyError, isEmergencyErrorCode } from '@/core/errors';
import { isRecord } from '@/core/guards';
import {
  isAbortResponse,
  isConfigResponse,
  isCurrentResponse,
  isEmergencyResultPayload,
  isErrorEnvelope,
  isRefreshResponse,
  isSessionResponse,
} from '@/core/guards';
import type { EmergencyError, EmergencyErrorCode } from '@/core/types';

export interface CsrfStrategy {
  readonly headerName: string;
  read(): string | null;
}

export interface MemoryCsrfStrategy extends CsrfStrategy {
  setToken(token: string | null): void;
}

export interface BffClientOptions {
  /** Full BFF route prefix, for example `https://example.com/de-bff/emergency`. */
  readonly bffBaseUrl: string;
  readonly timeoutMs?: number;
  readonly withCredentials?: boolean;
  readonly csrf?: CsrfStrategy;
  /**
   * Redirects are disabled by default: the client sends the CSRF token on every
   * request, and following a cross-origin redirect would hand it to another
   * host.
   */
  readonly maxRedirects?: number;
  /** Injection point for tests; the default is a configured axios instance. */
  readonly axiosInstance?: AxiosInstance;
  readonly generateIdempotencyKey?: () => string;
}

export function createMemoryCsrfStrategy(): MemoryCsrfStrategy {
  let token: string | null = null;

  return {
    headerName: 'X-CSRF-Token',
    read: () => token,
    setToken: (next) => {
      token = next;
    },
  };
}

/**
 * Laravel-compatible adapter. The core never assumes Laravel; a host that uses
 * the `XSRF-TOKEN` cookie opts in by passing this strategy.
 */
export function createCookieCsrfStrategy(
  cookieName = 'XSRF-TOKEN',
): CsrfStrategy {
  return {
    headerName: 'X-XSRF-TOKEN',
    read: () => {
      if (typeof document === 'undefined' || document.cookie === '') {
        return null;
      }

      const prefix = `${cookieName}=`;

      for (const entry of document.cookie.split(';')) {
        const trimmed = entry.trim();

        if (trimmed.startsWith(prefix)) {
          return decodeURIComponent(trimmed.slice(prefix.length));
        }
      }

      return null;
    },
  };
}

function defaultIdempotencyKey(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  // The key is an opaque de-duplication token, not a secret. Use the CSPRNG
  // when `randomUUID` is missing (for example in a non-secure context).
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    return `de-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
  }

  return `de-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const MAX_DETAILS_DEPTH = 2;
const MAX_DETAILS_ITEMS = 20;
const MAX_DETAILS_NODES = 500;
const MAX_DETAILS_STRING = 200;

/**
 * Error `details` may carry the whole upstream payload, including responder
 * phone numbers. Hosts forward errors to logging and telemetry, so keep only a
 * shallow, bounded copy.
 *
 * Arrays are collections, not structure: their entries are processed at the
 * array's depth so a list of records stays readable. A node budget keeps
 * pathological nesting bounded even without a depth increment per array.
 */
function redactDetails(value: unknown): unknown {
  return redactValue(value, 0, { remaining: MAX_DETAILS_NODES });
}

function redactValue(
  value: unknown,
  depth: number,
  budget: { remaining: number },
): unknown {
  if (budget.remaining <= 0) {
    return '…';
  }

  budget.remaining -= 1;

  if (value === null || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    return value.length > MAX_DETAILS_STRING
      ? `${value.slice(0, MAX_DETAILS_STRING)}…`
      : value;
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_DETAILS_ITEMS)
      .map((entry) => redactValue(entry, depth, budget));
  }

  if (isRecord(value)) {
    if (depth >= MAX_DETAILS_DEPTH) {
      return '{…}';
    }

    const result: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value).slice(
      0,
      MAX_DETAILS_ITEMS,
    )) {
      result[key] = redactValue(entry, depth + 1, budget);
    }

    return result;
  }

  return null;
}

export function normalizeAxiosError(error: unknown): EmergencyError {
  if (isAxiosError(error)) {
    if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
      return createEmergencyError('cancelled', 'The request was cancelled.', {
        cause: error,
      });
    }

    const status = error.response?.status ?? null;
    const data: unknown = error.response?.data;
    const headerRequestId = readHeader(error.response?.headers, 'x-request-id');

    if (isErrorEnvelope(data)) {
      const code: EmergencyErrorCode = isEmergencyErrorCode(data.error.code)
        ? data.error.code
        : 'upstream_error';

      return createEmergencyError(code, data.error.message, {
        status,
        requestId: data.error.request_id ?? headerRequestId,
        details: redactDetails(data.error.details),
        cause: error,
      });
    }

    if (status === null) {
      return createEmergencyError(
        'network',
        'The emergency service could not be reached.',
        { cause: error },
      );
    }

    return createEmergencyError(
      status >= 500 ? 'upstream_error' : 'unknown',
      error.message || 'The emergency service returned an error.',
      { status, requestId: headerRequestId, cause: error },
    );
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return createEmergencyError('cancelled', 'The request was cancelled.', {
        cause: error,
      });
    }

    return createEmergencyError('network', error.message, { cause: error });
  }

  return createEmergencyError(
    'unknown',
    'The emergency service returned an error.',
    {
      cause: error,
    },
  );
}

function readHeader(headers: unknown, name: string): string | null {
  if (!isRecord(headers)) {
    return null;
  }

  const direct = headers[name] ?? headers[name.toLowerCase()];

  if (typeof direct === 'string' && direct !== '') {
    return direct;
  }

  const getter = headers['get'];

  if (typeof getter === 'function') {
    // Axios headers expose `get(key)` through a callable property that cannot
    // be narrowed from `unknown` without an assertion.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const accessor = getter as (key: string) => unknown;
    const value = accessor.call(headers, name);

    return typeof value === 'string' && value !== '' ? value : null;
  }

  return typeof direct === 'string' && direct !== '' ? direct : null;
}

export function createBffAxiosInstance(
  options: BffClientOptions,
): AxiosInstance {
  return axios.create({
    baseURL: options.bffBaseUrl.replace(/\/+$/, ''),
    timeout: options.timeoutMs ?? 15000,
    withCredentials: options.withCredentials ?? true,
    maxRedirects: options.maxRedirects ?? 0,
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
}

export function createBffClient(options: BffClientOptions): BffClient {
  const csrf = options.csrf ?? createMemoryCsrfStrategy();
  const controllers = new Set<AbortController>();
  let destroyed = false;
  let csrfToken = csrf.read();

  const instance = options.axiosInstance ?? createBffAxiosInstance(options);

  function captureCsrf(payload: { csrf_token?: string }): void {
    if (typeof payload.csrf_token === 'string' && payload.csrf_token !== '') {
      csrfToken = payload.csrf_token;

      if ('setToken' in csrf && typeof csrf.setToken === 'function') {
        csrf.setToken(csrfToken);
      }
    }
  }

  async function execute<T>(
    config: AxiosRequestConfig,
    guard: (value: unknown) => value is T,
    externalSignal?: AbortSignal,
  ): Promise<T> {
    if (destroyed) {
      throw createEmergencyError(
        'destroyed',
        'The emergency client has been destroyed.',
      );
    }

    const controller = new AbortController();
    controllers.add(controller);

    const abortFromExternal = (): void => {
      controller.abort();
    };

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', abortFromExternal, {
          once: true,
        });
      }
    }

    const token = csrf.read() ?? csrfToken;
    const headers: Record<string, string> = {};

    if (isRecord(config.headers)) {
      for (const [key, entry] of Object.entries(config.headers)) {
        if (typeof entry === 'string') {
          headers[key] = entry;
        }
      }
    }

    if (token) {
      headers[csrf.headerName] = token;
    }

    try {
      const response = await instance.request<T>({
        ...config,
        headers,
        signal: controller.signal,
      });

      if (!guard(response.data)) {
        throw createEmergencyError(
          'invalid_response',
          'The emergency service returned an unexpected response.',
          { status: response.status, details: redactDetails(response.data) },
        );
      }

      return response.data;
    } catch (error) {
      if (isAxiosError(error) || error instanceof Error) {
        throw normalizeAxiosError(error);
      }

      throw error;
    } finally {
      controllers.delete(controller);
      externalSignal?.removeEventListener('abort', abortFromExternal);
    }
  }

  function idempotencyKey(provided?: string): string {
    return (
      provided ?? (options.generateIdempotencyKey ?? defaultIdempotencyKey)()
    );
  }

  return {
    async config(signal?: AbortSignal): Promise<ConfigResponse> {
      const payload = await execute(
        { method: 'GET', url: '/config' },
        isConfigResponse,
        signal,
      );
      captureCsrf(payload);

      return payload;
    },

    async session(
      code: string,
      signal?: AbortSignal,
    ): Promise<SessionResponse> {
      const payload = await execute(
        { method: 'POST', url: '/session', data: { code } },
        isSessionResponse,
        signal,
      );
      captureCsrf(payload);

      return payload;
    },

    async current(signal?: AbortSignal): Promise<CurrentResponse> {
      return execute(
        { method: 'GET', url: '/current' },
        isCurrentResponse,
        signal,
      );
    },

    async activate(
      request: ActivateRequest,
      signal?: AbortSignal,
      key?: string,
    ): Promise<EmergencyResultPayload> {
      return execute(
        {
          method: 'POST',
          url: '/activate',
          data: request,
          headers: { 'Idempotency-Key': idempotencyKey(key) },
        },
        isEmergencyResultPayload,
        signal,
      );
    },

    async simulacrum(
      signal?: AbortSignal,
      key?: string,
    ): Promise<EmergencyResultPayload> {
      return execute(
        {
          method: 'POST',
          url: '/simulacrum',
          headers: { 'Idempotency-Key': idempotencyKey(key) },
        },
        isEmergencyResultPayload,
        signal,
      );
    },

    async refresh(
      emergencyId: string,
      signal?: AbortSignal,
    ): Promise<RefreshResponse> {
      return execute(
        { method: 'POST', url: `/${encodeURIComponent(emergencyId)}/refresh` },
        isRefreshResponse,
        signal,
      );
    },

    async abort(
      emergencyId: string,
      signal?: AbortSignal,
    ): Promise<AbortResponse> {
      return execute(
        { method: 'DELETE', url: `/${encodeURIComponent(emergencyId)}` },
        isAbortResponse,
        signal,
      );
    },

    destroy(): void {
      destroyed = true;

      for (const controller of controllers) {
        controller.abort();
      }

      controllers.clear();
    },
  };
}
