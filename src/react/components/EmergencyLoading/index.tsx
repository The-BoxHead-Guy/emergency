import { copy } from '@/core/copy';
import { cls } from '@/react/classnames';

export function EmergencyLoading() {
  return (
    <div
      className={cls('emergency-status__loading')}
      role="status"
      aria-live="polite"
    >
      <span className={cls('emergency-status__spinner')} aria-hidden="true" />
      <span className={cls('emergency-status__loading-text')}>
        {copy.loading}
      </span>
    </div>
  );
}
