import type {
  EmergencyResultPayload,
  FailurePayload,
  ResponderPayload,
} from '@/core/bff-types';
import { isRecord } from '@/core/guards';
import type {
  EmergencyFailure,
  EmergencySnapshot,
  Responder,
  ResponderStatus,
  EmergencyTheme,
} from '@/core/types';

export function responderStatus(payload: ResponderPayload): ResponderStatus {
  if (payload.failed) {
    return 'failed';
  }

  if (payload.read) {
    return 'read';
  }

  if (payload.delivered) {
    return 'delivered';
  }

  if (payload.sent) {
    return 'sent';
  }

  return 'pending';
}

export function toResponder(payload: ResponderPayload): Responder {
  const last = payload.last_messages?.at(-1) ?? null;

  return {
    phone: payload.phone,
    name: payload.name,
    status: responderStatus(payload),
    sent: payload.sent,
    delivered: payload.delivered,
    read: payload.read,
    failed: payload.failed,
    messageId: payload.message_id,
    sentAt: payload.sent_at ?? null,
    deliveredAt: payload.delivered_at ?? null,
    readAt: payload.read_at ?? null,
    lastMessage: last
      ? { content: last.content ?? '', sentAt: last.sent_at ?? null }
      : null,
  };
}

export function toFailure(payload: FailurePayload): EmergencyFailure {
  return {
    phone: payload.phone,
    message: payload.message,
    status: payload.status ?? null,
  };
}

export function resultToSnapshot(
  result: EmergencyResultPayload,
  code: string,
): EmergencySnapshot {
  return {
    emergencyId: result.emergency_id ?? '',
    code,
    active: true,
    simulated: result.simulated,
    responders: result.responders.map(toResponder),
    createdAt: null,
    updatedAt: null,
    raw: { ...result },
  };
}

function readString(
  raw: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = raw[key];

    if (typeof value === 'string' && value !== '') {
      return value;
    }
  }

  return null;
}

function readBoolean(
  raw: Record<string, unknown>,
  keys: readonly string[],
): boolean | null {
  for (const key of keys) {
    const value = raw[key];

    if (typeof value === 'boolean') {
      return value;
    }
  }

  return null;
}

/**
 * Maps the upstream emergency payload (proxied by the BFF) into the snapshot the
 * UI renders. Unknown fields survive in `raw`, so the client never loses data
 * the BFF adds later.
 */
export function payloadToSnapshot(
  raw: Record<string, unknown>,
  options: { code?: string | null; simulated?: boolean } = {},
): EmergencySnapshot {
  const respondersValue = raw['responders'];
  const responders = Array.isArray(respondersValue)
    ? respondersValue.filter(isResponderPayloadLike).map(toResponder)
    : [];

  return {
    emergencyId: readString(raw, ['emergency_id', 'id']) ?? '',
    code: options.code ?? readString(raw, ['initiator_id', 'code']),
    active: readBoolean(raw, ['is_active', 'active']) ?? true,
    simulated:
      options.simulated ??
      readBoolean(raw, ['is_simulated', 'simulated']) ??
      false,
    responders,
    createdAt: readString(raw, ['created_at', 'createdAt']),
    updatedAt: readString(raw, ['updated_at', 'updatedAt']),
    raw,
  };
}

function isResponderPayloadLike(value: unknown): value is ResponderPayload {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['phone'] === 'string' && typeof value['name'] === 'string'
  );
}

export function themeToCssVariables(
  theme: EmergencyTheme | undefined,
): Record<string, string> {
  if (!theme) {
    return {};
  }

  const variables: Record<string, string> = {};
  const mapping: ReadonlyArray<[keyof EmergencyTheme, string]> = [
    ['accent', '--de-emergency-red'],
    ['accentContrast', '--de-emergency-on-red'],
    ['surface', '--de-emergency-white'],
    ['text', '--de-emergency-text'],
    ['muted', '--de-emergency-text-secondary'],
    ['radius', '--de-emergency-radius'],
  ];

  for (const [key, variable] of mapping) {
    const value = theme[key];

    if (value) {
      variables[variable] = value;
    }
  }

  return variables;
}
