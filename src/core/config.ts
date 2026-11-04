import { isRecord } from '@/core/guards';
import { normalizeFontLoading } from '@/core/fonts';
import { createEmergencyError } from '@/core/errors';
import type {
  EmergencyConfig,
  EmergencyError,
  EmergencyFallback,
  EmergencyRealtimeConfig,
} from '@/core/types';

export const EMERGENCY_CODE_PATTERN = /^[A-Za-z][A-Za-z0-9]{5}$/;

export const DEFAULT_REALTIME_CHANNEL_PATTERN = 'whatsapp.{phone}';

/**
 * Validates the host-supplied realtime block. Returns `null` when the value is
 * present but invalid; callers treat `undefined` as "realtime not requested".
 */
export function normalizeRealtimeConfig(
  value: unknown,
): EmergencyRealtimeConfig | null {
  if (!isRecord(value)) {
    return null;
  }

  const key = value['key'];
  const cluster = value['cluster'];
  const channelPattern = value['channelPattern'];

  if (
    typeof key !== 'string' ||
    key.trim() === '' ||
    typeof cluster !== 'string' ||
    cluster.trim() === ''
  ) {
    return null;
  }

  if (
    channelPattern !== undefined &&
    (typeof channelPattern !== 'string' ||
      channelPattern.trim() === '' ||
      !channelPattern.includes('{phone}'))
  ) {
    return null;
  }

  return {
    key,
    cluster,
    channelPattern: channelPattern ?? DEFAULT_REALTIME_CHANNEL_PATTERN,
  };
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isValidEmergencyCode(code: string): boolean {
  return EMERGENCY_CODE_PATTERN.test(code);
}

export function isValidFallback(value: unknown): value is EmergencyFallback {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['phone'] === 'string' &&
    value['phone'].trim() !== '' &&
    typeof value['label'] === 'string' &&
    value['label'].trim() !== ''
  );
}

export function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');

  return trimmed;
}

/**
 * Requests are sent with credentials and the CSRF token, so a plaintext or
 * attacker-controlled base URL would leak both. Same-origin paths (`/prefix`)
 * and HTTPS are accepted; plain HTTP is only accepted for loopback hosts.
 */
export function validateBaseUrl(baseUrl: string): string | null {
  if (baseUrl.startsWith('/')) {
    if (baseUrl.startsWith('//')) {
      return 'The BFF base URL must not be protocol-relative.';
    }

    return null;
  }

  let parsed: URL;

  try {
    parsed = new URL(baseUrl);
  } catch {
    return 'The BFF base URL must be an absolute URL or a same-origin path.';
  }

  if (parsed.username !== '' || parsed.password !== '') {
    return 'The BFF base URL must not embed credentials.';
  }

  if (parsed.protocol === 'https:') {
    return null;
  }

  if (
    parsed.protocol === 'http:' &&
    (LOOPBACK_HOSTS.has(parsed.hostname) ||
      parsed.hostname.endsWith('.localhost'))
  ) {
    return null;
  }

  return 'The BFF base URL must use https: (http: is only allowed for localhost).';
}

export interface ConfigValidationResult {
  readonly ok: boolean;
  readonly error: EmergencyError | null;
  readonly config: EmergencyConfig | null;
}

export type EmergencyConfigInput = Omit<EmergencyConfig, 'realtime'> & {
  readonly realtime?: unknown;
};

export function validateConfig(
  config: EmergencyConfigInput,
): ConfigValidationResult {
  const bffBaseUrl =
    typeof config.bffBaseUrl === 'string'
      ? normalizeBaseUrl(config.bffBaseUrl)
      : '';
  const code = typeof config.code === 'string' ? config.code.trim() : '';

  if (bffBaseUrl === '') {
    return {
      ok: false,
      config: null,
      error: createEmergencyError(
        'configuration',
        'A BFF base URL is required to mount the emergency client.',
      ),
    };
  }

  const baseUrlError = validateBaseUrl(bffBaseUrl);

  if (baseUrlError !== null) {
    return {
      ok: false,
      config: null,
      error: createEmergencyError('configuration', baseUrlError),
    };
  }

  if (!isValidEmergencyCode(code)) {
    return {
      ok: false,
      config: null,
      error: createEmergencyError(
        'configuration',
        'The identity code must be 6 characters and start with a letter.',
        { details: { code } },
      ),
    };
  }

  if (config.fallback !== undefined && !isValidFallback(config.fallback)) {
    return {
      ok: false,
      config: null,
      error: createEmergencyError(
        'configuration',
        'The fallback requires a non-empty phone and label.',
      ),
    };
  }

  const realtime =
    config.realtime === undefined
      ? undefined
      : normalizeRealtimeConfig(config.realtime);

  if (realtime === null) {
    return {
      ok: false,
      config: null,
      error: createEmergencyError(
        'configuration',
        'The realtime configuration requires a non-empty key and cluster, and a channel pattern containing {phone}.',
      ),
    };
  }

  return {
    ok: true,
    error: null,
    config: {
      ...config,
      bffBaseUrl,
      code,
      locale: config.locale ?? 'es',
      geolocationTimeoutMs: config.geolocationTimeoutMs ?? 8000,
      requestTimeoutMs: config.requestTimeoutMs ?? 15000,
      fontLoading: normalizeFontLoading(config.fontLoading),
      realtime,
    },
  };
}

export function assertValidConfig(config: EmergencyConfig): EmergencyConfig {
  const result = validateConfig(config);

  if (!result.ok || result.config === null) {
    throw result.error ?? new Error('Invalid emergency configuration.');
  }

  return result.config;
}
