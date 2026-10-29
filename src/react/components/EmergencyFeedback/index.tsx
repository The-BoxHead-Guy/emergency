import { copy } from '@/core/copy';
import type { AbortResult, SimulationResult } from '@/core/types';
import type { MessageDetail } from '@/react/components/MessageSurface';
import { MessageSurface } from '@/react/components/MessageSurface';
import { cls } from '@/react/classnames';

interface EmergencyFeedbackProps {
  readonly abortResult: AbortResult | null;
  readonly simulationResult: SimulationResult | null;
  readonly onDismiss: () => void;
}

export function EmergencyFeedback({
  abortResult,
  simulationResult,
  onDismiss,
}: EmergencyFeedbackProps) {
  const result = abortResult ?? simulationResult;

  if (!result) {
    return null;
  }

  const aborting = abortResult !== null;
  const success = result.ok;
  const title = success
    ? aborting
      ? copy.abortSuccessTitle
      : copy.simulateSuccessTitle
    : copy.errorTitle;
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
      text={result.message}
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
