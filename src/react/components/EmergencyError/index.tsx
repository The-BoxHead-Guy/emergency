import { copy } from '@/core/copy';
import type { EmergencyError as EmergencyErrorData } from '@/core/types';
import { MessageSurface } from '@/react/components/MessageSurface';
import { resolveEmergencyErrorMessage } from '@/react/support/messages';
import { cls } from '@/react/classnames';

export function EmergencyError({
  error,
  onRetry,
}: {
  readonly error: EmergencyErrorData;
  readonly onRetry: () => void;
}) {
  const message = resolveEmergencyErrorMessage(error);

  return (
    <MessageSurface
      variant={message.variant}
      icon={message.icon}
      title={message.title}
      text={message.text}
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
