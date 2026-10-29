import type {
  AbortResponse,
  ConfigResponse,
  CurrentResponse,
  EmergencyResultPayload,
  ErrorEnvelope,
  FailurePayload,
  RefreshResponse,
  RealtimePublicConfig,
  ResponderPayload,
  SessionResponse,
} from '@/core/bff-types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T,
): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

export function isRealtimeConfig(
  value: unknown,
): value is RealtimePublicConfig {
  if (
    !isRecord(value) ||
    value['mode'] !== 'public' ||
    !isRecord(value['pusher'])
  ) {
    return false;
  }

  const pusher = value['pusher'];

  return (
    isString(pusher['key']) &&
    isString(pusher['cluster']) &&
    isString(pusher['channel_pattern'])
  );
}

export function isConfigResponse(value: unknown): value is ConfigResponse {
  return (
    isRecord(value) &&
    isString(value['route_prefix']) &&
    isString(value['csrf_token']) &&
    isRealtimeConfig(value['realtime'])
  );
}

export function isSessionResponse(value: unknown): value is SessionResponse {
  return (
    isRecord(value) &&
    isString(value['code']) &&
    isString(value['csrf_token']) &&
    isFiniteNumber(value['expires_in'])
  );
}

export function isResponderPayload(value: unknown): value is ResponderPayload {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value['phone']) &&
    isString(value['name']) &&
    isBoolean(value['sent']) &&
    isBoolean(value['delivered']) &&
    isBoolean(value['read']) &&
    isBoolean(value['failed']) &&
    (value['message_id'] === null || isString(value['message_id']))
  );
}

export function isFailurePayload(value: unknown): value is FailurePayload {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value['phone']) &&
    isString(value['message']) &&
    (value['status'] === undefined ||
      value['status'] === null ||
      isFiniteNumber(value['status']))
  );
}

export function isEmergencyResultPayload(
  value: unknown,
): value is EmergencyResultPayload {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value['emergency_id'] === null || isString(value['emergency_id'])) &&
    isBoolean(value['simulated']) &&
    isArrayOf(value['responders'], isResponderPayload) &&
    isArrayOf(value['failures'], isFailurePayload)
  );
}

export function isCurrentResponse(value: unknown): value is CurrentResponse {
  if (
    !isRecord(value) ||
    !isBoolean(value['active']) ||
    !isRealtimeConfig(value['realtime'])
  ) {
    return false;
  }

  return (
    value['emergency'] === null ||
    (isRecord(value['emergency']) && !Array.isArray(value['emergency']))
  );
}

export function isRefreshResponse(value: unknown): value is RefreshResponse {
  return (
    isRecord(value) &&
    isRecord(value['emergency']) &&
    isArrayOf(value['responders'], isResponderPayload)
  );
}

export function isAbortResponse(value: unknown): value is AbortResponse {
  return (
    isEmergencyResultPayload(value) &&
    isRecord(value) &&
    isBoolean(value['deleted'])
  );
}

export function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  if (!isRecord(value) || !isRecord(value['error'])) {
    return false;
  }

  const error = value['error'];

  return (
    isString(error['code']) &&
    isString(error['message']) &&
    (error['details'] === undefined ||
      error['details'] === null ||
      isRecord(error['details']) ||
      Array.isArray(error['details'])) &&
    (error['request_id'] === undefined || isString(error['request_id']))
  );
}
