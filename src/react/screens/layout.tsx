import type { ReactNode } from 'react';
import { cls } from '@/react/classnames';
import type { EmergencyScreenId } from '@/react/screens/types';

export interface EmergencyScreenLayoutProps {
  readonly screen: EmergencyScreenId;
  readonly titleId: string;
  readonly header: ReactNode;
  readonly footer: ReactNode;
  readonly children: ReactNode;
  readonly bodyClassName?: string;
}

/**
 * Shared shell for every screen. The wrapper is `display: contents` so the
 * header, body and footer stay direct grid rows of the emergency panel.
 */
export function EmergencyScreenLayout({
  screen,
  titleId,
  header,
  footer,
  children,
  bodyClassName,
}: EmergencyScreenLayoutProps) {
  return (
    <div className={cls('emergency-screen')} data-screen={screen}>
      {header}
      <section
        className={cls('emergency-panel__body', bodyClassName ?? null)}
        aria-labelledby={titleId}
      >
        {children}
      </section>
      {footer}
    </div>
  );
}
