export interface ConfigResponse {
  readonly route_prefix: string;
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
  readonly reporter_phone?: string | null;
  readonly responders: readonly ResponderPayload[];
  readonly failures: readonly FailurePayload[];
  readonly partial_failure?: boolean;
  readonly total_failure?: boolean;
}

export type EmergencyPayload = Readonly<Record<string, unknown>>;

export interface CurrentResponse {
  readonly active: boolean;
  readonly emergency: EmergencyPayload | null;
}

export interface GeolocationRequest {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy?: number;
}

export interface ActivateRequest {
  readonly geolocation?: GeolocationRequest;
  readonly reporter_phone?: string;
}

export interface SimulacrumRequest {
  readonly geolocation?: GeolocationRequest;
}

export interface RefreshResponse {
  readonly emergency: EmergencyPayload;
}

export interface AbortResponse extends EmergencyResultPayload {
  readonly deleted: boolean;
}

export interface CreditSummaryPayload {
  readonly code: string;
  readonly domain: string;
  readonly balance: number;
  readonly contacts_count: number;
  readonly rounds: number;
  readonly extra_alerts: number;
  readonly rounds_label: string;
}

export interface CreditSummaryResponse {
  readonly credit: CreditSummaryPayload;
}

export interface CreditHistoryItemPayload {
  readonly id: number;
  readonly type: string;
  readonly amount: number;
  readonly balance_after: number;
  readonly contacts_count: number;
  readonly rounds: number;
  readonly extra_alerts: number;
  readonly emergency_id: number | null;
  readonly reference: string | null;
  readonly created_at: string | null;
}

export interface CreditHistoryPaginationPayload {
  readonly total: number;
  readonly per_page: number;
  readonly current_page: number;
  readonly last_page: number;
}

export interface CreditHistoryResponse {
  readonly items: readonly CreditHistoryItemPayload[];
  readonly pagination?: CreditHistoryPaginationPayload;
}

/** Optional query for `GET /credits/history`. */
export interface CreditHistoryQuery {
  readonly page?: number;
  readonly perPage?: number;
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
  | 'credits'
  | 'creditHistory'
  | 'activate'
  | 'simulacrum'
  | 'refresh'
  | 'abort'
  | 'config';

export interface BffClient {
  config(signal?: AbortSignal): Promise<ConfigResponse>;
  session(code: string, signal?: AbortSignal): Promise<SessionResponse>;
  current(signal?: AbortSignal): Promise<CurrentResponse>;
  credits(signal?: AbortSignal): Promise<CreditSummaryResponse>;
  creditHistory(
    query?: CreditHistoryQuery,
    signal?: AbortSignal,
  ): Promise<CreditHistoryResponse>;
  activate(
    request: ActivateRequest,
    signal?: AbortSignal,
    idempotencyKey?: string,
  ): Promise<EmergencyResultPayload>;
  simulacrum(
    request: SimulacrumRequest,
    signal?: AbortSignal,
    idempotencyKey?: string,
  ): Promise<EmergencyResultPayload>;
  refresh(emergencyId: string, signal?: AbortSignal): Promise<RefreshResponse>;
  abort(emergencyId: string, signal?: AbortSignal): Promise<AbortResponse>;
  destroy(): void;
}
