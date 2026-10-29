export interface RealtimePusherConfig {
  readonly key: string;
  readonly cluster: string;
  readonly channel_pattern: string;
}

export interface RealtimePublicConfig {
  readonly mode: 'public';
  readonly pusher: RealtimePusherConfig;
}

export interface ConfigResponse {
  readonly route_prefix: string;
  readonly realtime: RealtimePublicConfig;
  readonly csrf_token: string;
}

export interface SessionRequest {
  readonly code: string;
}

export interface SessionResponse {
  readonly code: string;
  readonly csrf_token: string;
  readonly expires_in: number;
}

export interface ResponderMessagePayload {
  readonly content?: string | null;
  readonly sent_at?: string | null;
}

export interface ResponderPayload {
  readonly phone: string;
  readonly name: string;
  readonly sent: boolean;
  readonly delivered: boolean;
  readonly read: boolean;
  readonly failed: boolean;
  readonly message_id: string | null;
  readonly sent_at?: string | null;
  readonly delivered_at?: string | null;
  readonly read_at?: string | null;
  readonly last_messages?: readonly ResponderMessagePayload[] | null;
}

export interface FailurePayload {
  readonly phone: string;
  readonly message: string;
  readonly status?: number | null;
}

export interface EmergencyResultPayload {
  readonly emergency_id: string | null;
  readonly simulated: boolean;
  readonly responders: readonly ResponderPayload[];
  readonly failures: readonly FailurePayload[];
  readonly partial_failure?: boolean;
  readonly total_failure?: boolean;
}

export type EmergencyPayload = Readonly<Record<string, unknown>>;

export interface CurrentResponse {
  readonly active: boolean;
  readonly emergency: EmergencyPayload | null;
  readonly realtime: RealtimePublicConfig;
}

export interface GeolocationRequest {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy?: number;
}

export interface ActivateRequest {
  readonly geolocation?: GeolocationRequest;
}

export interface RefreshResponse {
  readonly emergency: EmergencyPayload;
  readonly responders: readonly ResponderPayload[];
}

export interface AbortResponse extends EmergencyResultPayload {
  readonly deleted: boolean;
}

export interface ErrorEnvelope {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
    readonly request_id?: string;
  };
}

export type BffClientMethod =
  | 'session'
  | 'current'
  | 'activate'
  | 'simulacrum'
  | 'refresh'
  | 'abort'
  | 'config';

export interface BffClient {
  config(signal?: AbortSignal): Promise<ConfigResponse>;
  session(code: string, signal?: AbortSignal): Promise<SessionResponse>;
  current(signal?: AbortSignal): Promise<CurrentResponse>;
  activate(
    request: ActivateRequest,
    signal?: AbortSignal,
    idempotencyKey?: string,
  ): Promise<EmergencyResultPayload>;
  simulacrum(
    signal?: AbortSignal,
    idempotencyKey?: string,
  ): Promise<EmergencyResultPayload>;
  refresh(emergencyId: string, signal?: AbortSignal): Promise<RefreshResponse>;
  abort(emergencyId: string, signal?: AbortSignal): Promise<AbortResponse>;
  destroy(): void;
}
