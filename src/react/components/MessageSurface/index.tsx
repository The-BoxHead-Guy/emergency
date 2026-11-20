import type { ReactNode } from 'react';
import type { IconName } from '@/react/components/Icon';
import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';

export interface MessageSurfaceProps {
  readonly variant: 'success' | 'warning' | 'error';
  readonly icon: IconName;
  readonly title: string;
  readonly text: string;
  readonly className?: string;
  readonly children?: ReactNode;
}

const surfacePrefix = {
  success: 'simulacrum-success-message',
  warning: 'emergency-warning-message',
  error: 'emergency-error-message',
} as const;

export function MessageSurface(props: MessageSurfaceProps) {
  const { variant, icon, title, text, className, children } = props;
  const prefix = surfacePrefix[variant];
  const positive = variant !== 'error';

  return (
    <div
      className={[cls(prefix), className].filter(Boolean).join(' ')}
      role={positive ? 'status' : 'alert'}
      aria-live={positive ? 'polite' : 'assertive'}
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
