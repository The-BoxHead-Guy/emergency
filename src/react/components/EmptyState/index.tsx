import type { IconName } from '@/react/components/Icon';
import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';

export interface EmptyStateProps {
  readonly message: string;
  readonly icon?: IconName;
  readonly className?: string;
}

/**
 * Card-shaped placeholder shown when a screen has no content to list.
 */
export function EmptyState({
  message,
  icon = 'inbox',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={[cls('emergency-empty-state'), className]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon name={icon} className={cls('emergency-empty-state__icon')} />
      <p className={cls('emergency-empty-state__text')}>{message}</p>
    </div>
  );
}
