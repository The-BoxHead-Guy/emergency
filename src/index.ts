export { mount } from '@/mount';
export { createEmergencyController } from '@/core/controller';
export {
  createBffClient,
  createCookieCsrfStrategy,
  createMemoryCsrfStrategy,
} from '@/core/bff-client';
export { createBrowserGeolocationProvider } from '@/core/geolocation';
export { createPusherRealtimeProvider } from '@/core/realtime';
export { EMERGENCY_EVENT_NAMES } from '@/core/events';
export {
  EMERGENCY_PHASE_NAMES,
  EMERGENCY_TRANSITIONS,
  canTransition,
} from '@/core/state-machine';
export {
  EMERGENCY_CODE_PATTERN,
  isValidEmergencyCode,
  normalizeBaseUrl,
  validateConfig,
} from '@/core/config';
export { themeToCssVariables } from '@/core/mappers';
export {
  createEmergencyError,
  isEmergencyError,
  toEmergencyError,
  EmergencyClientError,
} from '@/core/errors';

export type {
  AbortResult,
  EmergencyClient,
  EmergencyClientState,
  EmergencyConfig,
  EmergencyError,
  EmergencyErrorCode,
  EmergencyEventMap,
  EmergencyEventName,
  EmergencyFallback,
  EmergencyFailure,
  EmergencyGeolocation,
  EmergencyMountOptions,
  EmergencyOperation,
  EmergencyPhase,
  EmergencyPhaseName,
  EmergencySnapshot,
  EmergencyTheme,
  EmergencyTrigger,
  Message,
  MessageKind,
  PanelCloseReason,
  PanelOpenReason,
  RealtimeStatus,
  Responder,
  ResponderStatus,
  SimulationResult,
} from '@/core/types';

export type {
  AbortResponse,
  ActivateRequest,
  BffClient,
  ConfigResponse,
  CurrentResponse,
  EmergencyResultPayload,
  FailurePayload,
  RefreshResponse,
  ResponderPayload,
  SessionResponse,
} from '@/core/bff-types';

export type { BffClientOptions, CsrfStrategy } from '@/core/bff-client';
export type {
  EmergencyController,
  EmergencyControllerDeps,
} from '@/core/controller';
export type { EmergencyStore } from '@/core/store';
export type { EmergencyEventEmitter } from '@/core/events';
