export type EmergencyPhaseName =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'activating'
  | 'simulating'
  | 'active'
  | 'refreshing'
  | 'aborting'
  | 'error';

/**
 * The lifecycle phase. It is a discriminated union so consumers can switch on
 * `kind` and read the data that belongs to that phase without casting.
 */
export type EmergencyPhase =
  | { kind: 'idle' }
  | { kind: 'initializing' }
  | { kind: 'ready' }
  | { kind: 'activating' }
  | { kind: 'simulating' }
  | { kind: 'active'; emergencyId: string; simulated: boolean }
  | { kind: 'refreshing'; emergencyId: string }
  | { kind: 'aborting'; emergencyId: string }
  | { kind: 'error'; error: EmergencyError };

export type ResponderStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export interface ResponderMessage {
  readonly content: string;
  readonly sentAt: string | null;
}

export interface Responder {
  readonly phone: string;
  readonly name: string;
  readonly status: ResponderStatus;
  readonly sent: boolean;
  readonly delivered: boolean;
  readonly read: boolean;
  readonly failed: boolean;
  readonly messageId: string | null;
  readonly sentAt: string | null;
  readonly deliveredAt: string | null;
  readonly readAt: string | null;
  readonly lastMessage: ResponderMessage | null;
}

export interface EmergencyFailure {
  readonly phone: string;
  readonly message: string;
  readonly status: number | null;
}

export type MessageKind = 'info' | 'success' | 'warning' | 'error';

export interface Message {
  readonly id: string;
  readonly kind: MessageKind;
  readonly text: string;
  readonly createdAt: number;
}

export const EMERGENCY_ERROR_CODES = [
  'configuration',
  'network',
  'cancelled',
  'invalid_response',
  'invalid_transition',
  'destroyed',
  'geolocation_denied',
  'geolocation_unavailable',
  'geolocation_timeout',
  'geolocation_unsupported',
  'validation_failed',
  'invalid_code',
  'inactive_code',
  'unauthenticated',
  'csrf_failed',
  'cross_origin_denied',
  'rate_limited',
  'not_found',
  'method_not_allowed',
  'emergency_already_active',
  'emergency_forbidden',
  'emergency_not_found',
  'missing_emergency_contacts',
  'missing_medical_profile',
  'whatsapp_delivery_failed',
  'upstream_error',
  'internal_error',
  'emergency_error',
  'unknown',
] as const;

export type EmergencyErrorCode = (typeof EMERGENCY_ERROR_CODES)[number];

export interface EmergencyError {
  readonly code: EmergencyErrorCode;
  readonly message: string;
  readonly status: number | null;
  readonly requestId: string | null;
  readonly details: unknown;
  readonly cause: unknown;
}

export interface EmergencyFallback {
  readonly phone: string;
  readonly label: string;
}

export interface EmergencyTheme {
  readonly accent?: string;
  readonly accentContrast?: string;
  readonly surface?: string;
  readonly text?: string;
  readonly muted?: string;
  readonly radius?: string;
}

export interface EmergencyGeolocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy?: number;
}

export interface EmergencyConfig {
  /** Full BFF route prefix, for example `https://example.com/de-bff/emergency`. */
  readonly bffBaseUrl: string;
  /** 6-character identity code supplied by the host. */
  readonly code: string;
  /** Optional phone number shown when geolocation or activation fails. */
  readonly fallback?: EmergencyFallback;
  /** Optional theme values mapped to `--de-emergency-*` CSS variables. */
  readonly theme?: EmergencyTheme;
  /** BCP 47 locale used for dates and numbers. Defaults to `es`. */
  readonly locale?: string;
  /** Geolocation timeout in milliseconds. Defaults to 8000. */
  readonly geolocationTimeoutMs?: number;
  /** Request timeout in milliseconds. Defaults to 15000. */
  readonly requestTimeoutMs?: number;
}

export interface EmergencySnapshot {
  readonly emergencyId: string;
  readonly code: string | null;
  readonly active: boolean;
  readonly simulated: boolean;
  readonly responders: readonly Responder[];
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly raw: Readonly<Record<string, unknown>>;
}

export type EmergencyOperation =
  | 'mount'
  | 'session'
  | 'resume'
  | 'activate'
  | 'simulate'
  | 'refresh'
  | 'abort'
  | 'geolocation'
  | 'realtime';

export type PanelOpenReason = 'trigger' | 'activate' | 'resume' | 'manual';
export type PanelCloseReason =
  | 'escape'
  | 'close'
  | 'abort'
  | 'destroy'
  | 'manual';

export interface EmergencyEventMap {
  'session:ready': { readonly code: string; readonly expiresIn: number };
  'emergency:activated': { readonly snapshot: EmergencySnapshot };
  'emergency:simulated': {
    readonly responders: readonly Responder[];
    readonly failures: readonly EmergencyFailure[];
  };
  'emergency:resumed': { readonly snapshot: EmergencySnapshot };
  'emergency:updated': { readonly snapshot: EmergencySnapshot };
  'emergency:aborted': {
    readonly emergencyId: string;
    readonly responders: readonly Responder[];
  };
  'emergency:failed': {
    readonly error: EmergencyError;
    readonly operation: EmergencyOperation;
  };
  'emergency:fallback': {
    readonly error: EmergencyError;
    readonly fallback: EmergencyFallback | null;
  };
  'panel:opened': { readonly reason: PanelOpenReason };
  'panel:closed': { readonly reason: PanelCloseReason };
}

export type EmergencyEventName = keyof EmergencyEventMap;

export type EmergencyEventHandler<K extends EmergencyEventName> = (
  payload: EmergencyEventMap[K],
) => void;

export type RealtimeStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'unavailable';

export interface AbortResult {
  readonly ok: boolean;
  readonly message: string;
  readonly at: number;
}

export interface SimulationResult {
  readonly ok: boolean;
  readonly message: string;
  readonly at: number;
}

export interface EmergencyClientState {
  readonly config: EmergencyConfig;
  readonly phase: EmergencyPhase;
  readonly panelOpen: boolean;
  readonly sessionReady: boolean;
  readonly resumeAvailable: boolean;
  readonly snapshot: EmergencySnapshot | null;
  readonly responders: readonly Responder[];
  readonly failures: readonly EmergencyFailure[];
  readonly messages: readonly Message[];
  readonly lastError: EmergencyError | null;
  readonly geolocation: EmergencyGeolocation | null;
  readonly geolocationError: EmergencyError | null;
  readonly realtimeStatus: RealtimeStatus;
  readonly abortResult: AbortResult | null;
  readonly simulationResult: SimulationResult | null;
  readonly abortConfirmation: boolean;
  readonly simulationConfirmation: boolean;
  readonly destroyed: boolean;
}

export interface EmergencyClient {
  open(reason?: PanelOpenReason): void;
  close(reason?: PanelCloseReason): void;
  destroy(): void;
  getState(): EmergencyClientState;
  subscribe(listener: (state: EmergencyClientState) => void): () => void;
  on<K extends EmergencyEventName>(
    event: K,
    handler: EmergencyEventHandler<K>,
  ): () => void;
  off<K extends EmergencyEventName>(
    event: K,
    handler: EmergencyEventHandler<K>,
  ): void;
  ensureSession(): Promise<void>;
  resume(): Promise<void>;
  dismissResume(): void;
  activate(): Promise<void>;
  simulate(): Promise<void>;
  refresh(): Promise<void>;
  abort(): Promise<void>;
  requestAbortConfirmation(): void;
  cancelAbortConfirmation(): void;
  requestSimulationConfirmation(): void;
  cancelSimulationConfirmation(): void;
  dismissFeedback(): void;
}

export type EmergencyTrigger =
  | string
  | HTMLElement
  | ((open: () => void) => void | (() => void));

export interface EmergencyMountOptions extends EmergencyConfig {
  readonly root: HTMLElement | string;
  readonly trigger?: EmergencyTrigger;
  readonly onEvent?: <K extends EmergencyEventName>(
    event: K,
    payload: EmergencyEventMap[K],
  ) => void;
}
