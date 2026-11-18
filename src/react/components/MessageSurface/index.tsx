import type { ReactNode } from 'react';
import type { IconName } from '@/react/components/Icon';
import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';

export interface MessageSurfaceProps {
  readonly variant: 'success' | 'error';
  readonly icon: IconName;
  readonly title: string;
  readonly text: string;
  readonly className?: string;
  readonly children?: ReactNode;
}

export function MessageSurface(props: MessageSurfaceProps) {
  const { variant, icon, title, text, className, children } = props;
  const prefix =
    variant === 'success'
      ? 'simulacrum-success-message'
      : 'emergency-error-message';
  const success = variant === 'success';

  return (
    <div
      className={[cls(prefix), className].filter(Boolean).join(' ')}
      role={success ? 'status' : 'alert'}
      aria-live={success ? 'polite' : 'assertive'}
    >
      <div className={cls(`${prefix}__container`)}>
        <div className={cls(`${prefix}__icon`)}>
          <Icon name={icon} className="status-icon" />
        </div>
        <div className={cls(`${prefix}__content`)}>
          <h3 className={cls(`${prefix}__title`)}>{title}</h3>
          <p className={cls(`${prefix}__text`)}>{text}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
