import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';

/**
 * Explicit responder state model:
 * - `failed`: the send operation failed (red alert in the "Sent" cell only).
 * - `confirmed`: checked circle.
 * - otherwise: unchecked circle.
 */
export function StatusIcon({
  confirmed,
  failed = false,
}: {
  readonly confirmed: boolean;
  readonly failed?: boolean;
}) {
  const name = failed
    ? 'exclamation-circle'
    : confirmed
      ? 'check-circle'
      : 'x-circle';
  const modifier = failed
    ? 'status-icon--failed'
    : confirmed
      ? 'status-icon--checked'
      : 'status-icon--unchecked';

  return <Icon name={name} className={cls('status-icon', modifier)} />;
}
