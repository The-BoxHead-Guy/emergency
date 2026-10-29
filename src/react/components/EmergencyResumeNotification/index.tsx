import { useId } from 'react';
import { copy } from '@/core/copy';
import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';

export interface EmergencyResumeNotificationProps {
  resumeAvailable: boolean;
  onOpen: () => void;
}

export function EmergencyResumeNotification(
  props: EmergencyResumeNotificationProps,
) {
  const { resumeAvailable, onOpen } = props;
  const titleId = useId();

  if (!resumeAvailable) {
    return null;
  }

  return (
    <div
      className={cls('emergency-resume-notification-overlay')}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className={cls('emergency-resume-notification-card')}>
        <div
          className={cls('emergency-resume-notification-icon')}
          aria-hidden="true"
        >
          <Icon name="alert-triangle" />
        </div>
        <h2 className={cls('emergency-resume-notification-title')} id={titleId}>
          {copy.resumeTitle}
        </h2>
        <p className={cls('emergency-resume-notification-message')}>
          {copy.resumeDescription}
        </p>
        <button
          type="button"
          className={cls('emergency-resume-notification-button')}
          aria-label={copy.resumeAction}
          onClick={onOpen}
        >
          <Icon name="eye" />
          {copy.resumeAction}
        </button>
      </div>
    </div>
  );
}
