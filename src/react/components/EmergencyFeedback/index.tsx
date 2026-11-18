import { useEffect, useRef } from 'react';
import { copy } from '@/core/copy';
import type {
  AbortResult,
  EmergencyError,
  SimulationResult,
} from '@/core/types';
import { MessageSurface } from '@/react/components/MessageSurface';
import { resolveFeedbackMessage } from '@/react/support/messages';
import { cls } from '@/react/classnames';

/** Time the feedback stays on screen before dismissing itself. */
export const FEEDBACK_AUTO_DISMISS_MS = 12000;

/** Time the geolocation feedback stays on screen before dismissing itself. */
export const GEOLOCATION_FEEDBACK_AUTO_DISMISS_MS = 12000;

interface EmergencyFeedbackProps {
  readonly abortResult: AbortResult | null;
  readonly simulationResult: SimulationResult | null;
  readonly geolocationError: EmergencyError | null;
  readonly activationError?: EmergencyError | null;
  readonly onDismiss: () => void;
}

export function EmergencyFeedback({
  abortResult,
  simulationResult,
  geolocationError,
  activationError,
  onDismiss,
}: EmergencyFeedbackProps) {
  const message = resolveFeedbackMessage({
    abortResult,
    simulationResult,
    geolocationError,
    activationError,
  });
  const dismissRef = useRef(onDismiss);
  const autoDismissMs =
    geolocationError || activationError
      ? GEOLOCATION_FEEDBACK_AUTO_DISMISS_MS
      : FEEDBACK_AUTO_DISMISS_MS;
  const feedbackKey =
    abortResult?.at ??
    simulationResult?.at ??
    geolocationError?.code ??
    activationError?.code ??
    null;

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (feedbackKey === null) {
      return;
    }

    const timeout = setTimeout(() => dismissRef.current(), autoDismissMs);

    return () => clearTimeout(timeout);
  }, [autoDismissMs, feedbackKey]);

  if (!message) {
    return null;
  }

  return (
    <MessageSurface
      variant={message.variant}
      icon={message.icon}
      title={message.title}
      text={message.text}
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
