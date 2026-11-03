import { useEffect, useRef } from 'react';
import { copy } from '@/core/copy';
import type {
  AbortResult,
  EmergencyError,
  SimulationResult,
} from '@/core/types';
import type { MessageDetail } from '@/react/components/MessageSurface';
import { MessageSurface } from '@/react/components/MessageSurface';
import { cls } from '@/react/classnames';

/** Time the feedback stays on screen before dismissing itself. */
export const FEEDBACK_AUTO_DISMISS_MS = 3000;

/** Time the geolocation feedback stays on screen before dismissing itself. */
export const GEOLOCATION_FEEDBACK_AUTO_DISMISS_MS = 5000;

interface EmergencyFeedbackProps {
  readonly abortResult: AbortResult | null;
  readonly simulationResult: SimulationResult | null;
  readonly geolocationError: EmergencyError | null;
  readonly activationError?: EmergencyError | null;
  readonly onDismiss: () => void;
}

interface FeedbackSurfaceProps {
  readonly result: AbortResult | SimulationResult | null;
  readonly aborting: boolean;
  readonly geolocationError: EmergencyError | null;
  readonly activationError?: EmergencyError | null;
  readonly onDismiss: () => void;
}

function geolocationText(error: EmergencyError): string {
  switch (error.code) {
    case 'geolocation_denied':
      return copy.geolocationDenied;
    case 'geolocation_timeout':
      return copy.geolocationTimeout;
    case 'geolocation_unsupported':
      return copy.geolocationUnsupported;
    default:
      return copy.geolocationUnavailable;
  }
}

export function EmergencyFeedback({
  abortResult,
  simulationResult,
  geolocationError,
  activationError,
  onDismiss,
}: EmergencyFeedbackProps) {
  const result = abortResult ?? simulationResult;
  const feedbackActivationError = result ? null : (activationError ?? null);
  const feedbackGeolocationError =
    result || feedbackActivationError ? null : geolocationError;

  if (!result && !feedbackActivationError && !feedbackGeolocationError) {
    return null;
  }

  return (
    <FeedbackSurface
      result={result}
      aborting={abortResult !== null}
      geolocationError={feedbackGeolocationError}
      activationError={feedbackActivationError}
      onDismiss={onDismiss}
    />
  );
}

function FeedbackSurface({
  result,
  aborting,
  geolocationError,
  activationError,
  onDismiss,
}: FeedbackSurfaceProps) {
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const timeout = setTimeout(
      () => dismissRef.current(),
      geolocationError || activationError
        ? GEOLOCATION_FEEDBACK_AUTO_DISMISS_MS
        : FEEDBACK_AUTO_DISMISS_MS,
    );

    return () => clearTimeout(timeout);
  }, [result?.at, geolocationError, activationError]);

  const success = result?.ok === true;
  const title = success
    ? aborting
      ? copy.abortSuccessTitle
      : copy.simulateSuccessTitle
    : copy.errorTitle;
  const text = success
    ? (result?.message ?? '')
    : geolocationError
      ? geolocationText(geolocationError)
      : activationError
        ? activationError.message || copy.errorText
        : (result?.message ?? copy.errorText);
  const details: readonly MessageDetail[] = success
    ? aborting
      ? [{ icon: 'message', text: copy.abortSuccessDetails }]
      : [
          { icon: 'message', text: copy.simulateSuccessDetails },
          { icon: 'clock', text: copy.simulateSuccessCompleted },
        ]
    : [
        { icon: 'info', text: copy.errorDetailInfo },
        { icon: 'arrow-left', text: copy.errorDetailRetry },
      ];

  return (
    <MessageSurface
      variant={success ? 'success' : 'error'}
      icon={success ? 'check-circle' : 'alert-triangle'}
      title={title}
      text={text}
      details={details}
      className={cls('emergency-feedback')}
    >
      <button
        type="button"
        className={cls('emergency-feedback__dismiss')}
        onClick={onDismiss}
      >
        {copy.feedbackDismiss}
      </button>
    </MessageSurface>
  );
}
