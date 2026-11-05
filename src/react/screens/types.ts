import type { ComponentType } from 'react';
import type {
  AbortResult,
  EmergencyError,
  PanelCloseReason,
  Responder,
  SimulationResult,
} from '@/core/types';

export type EmergencyScreenId =
  | 'primary'
  | 'pre-emergency'
  | 'pricing'
  | 'details';

/** Props every screen receives from the panel shell. */
export interface EmergencyScreenProps {
  readonly titleId: string;
  readonly active: boolean;
  readonly busy: boolean;
  readonly aborting: boolean;
  readonly loading: boolean;
  readonly locale: string;
  readonly responders: readonly Responder[];
  readonly refreshing: boolean;
  readonly geolocationError: EmergencyError | null;
  readonly contactPhone: string | null;
  readonly activationError?: EmergencyError | null;
  readonly error: EmergencyError | null;
  readonly abortResult: AbortResult | null;
  readonly simulationResult: SimulationResult | null;
  readonly feedbackVisible: boolean;
  readonly onClose: (reason: PanelCloseReason) => void;
  readonly onActivate: () => void;
  readonly onRefresh: () => void;
  readonly onRetry: () => void;
  readonly onDismissFeedback: () => void;
  readonly onRequestAbort: () => void;
  readonly onRequestSimulation: () => void;
  readonly onSetContactPhone: (phone: string | null) => void;
}

export type EmergencyScreenComponent = ComponentType<EmergencyScreenProps>;
