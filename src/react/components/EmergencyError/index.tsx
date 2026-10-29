import { copy } from '@/core/copy';
import type { EmergencyError as EmergencyErrorData } from '@/core/types';
import { MessageSurface } from '@/react/components/MessageSurface';
import { cls } from '@/react/classnames';

export function EmergencyError({
  error,
  onRetry,
}: {
  readonly error: EmergencyErrorData;
  readonly onRetry: () => void;
}) {
  return (
    <MessageSurface
      variant="error"
      icon="exclamation-circle"
      title={copy.errorTitle}
      text={error.message || copy.errorText}
      details={[
        { icon: 'info', text: copy.errorDetailInfo },
        { icon: 'arrow-left', text: copy.errorDetailRetry },
      ]}
    >
      <button
        type="button"
        className={cls('emergency-feedback__dismiss')}
        onClick={onRetry}
      >
        {copy.retry}
      </button>
    </MessageSurface>
  );
}
