import type { EmergencyError, EmergencyErrorCode } from '@/core/types';
import { EMERGENCY_ERROR_CODES } from '@/core/types';
import { isRecord } from '@/core/guards';

export function isEmergencyErrorCode(
  value: unknown,
): value is EmergencyErrorCode {
  return (
    typeof value === 'string' &&
    EMERGENCY_ERROR_CODES.some((code) => code === value)
  );
}

export interface EmergencyErrorOptions {
  status?: number | null;
  requestId?: string | null;
  details?: unknown;
  cause?: unknown;
}

export function createEmergencyError(
  code: EmergencyErrorCode,
  message: string,
  options: EmergencyErrorOptions = {},
): EmergencyError {
  return {
    code,
    message,
    status: options.status ?? null,
    requestId: options.requestId ?? null,
    details: options.details ?? null,
    cause: options.cause ?? null,
  };
}

export function isEmergencyError(value: unknown): value is EmergencyError {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['code'] === 'string' &&
    typeof value['message'] === 'string' &&
    'status' in value &&
    'requestId' in value
  );
}

export function toEmergencyError(
  value: unknown,
  fallbackCode: EmergencyErrorCode = 'unknown',
): EmergencyError {
  if (isEmergencyError(value)) {
    return value;
  }

  if (value instanceof Error) {
    return createEmergencyError(fallbackCode, value.message, { cause: value });
  }

  return createEmergencyError(fallbackCode, 'An unexpected error occurred.', {
    cause: value,
  });
}

/**
 * Error object accepted by host integrations that prefer `throw`/`catch` while
 * the library still exposes the typed error through `.error`.
 */
export class EmergencyClientError extends Error {
  readonly error: EmergencyError;

  constructor(error: EmergencyError) {
    super(error.message);
    this.name = 'EmergencyClientError';
    this.error = error;
  }
}
