import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { cls } from '@/react/classnames';
import { Icon } from '@/react/components/Icon';

export interface CollapsibleProps {
  readonly head: ReactNode;
  readonly children: ReactNode;
}

/**
 * Single collapsible item. The head is a button that toggles the body, and the
 * body is mounted only while open.
 */
export function Collapsible({ head, children }: CollapsibleProps) {
  const bodyId = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className={cls('emergency-collapsible')}>
      <button
        type="button"
        className={cls('emergency-collapsible__head')}
        aria-expanded={open}
        aria-controls={open ? bodyId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={cls('emergency-collapsible__summary')}>{head}</span>
        <Icon
          name={open ? 'chevron-up' : 'chevron-down'}
          className={cls('emergency-collapsible__chevron')}
        />
      </button>
      {open ? (
        <div id={bodyId} className={cls('emergency-collapsible__body')}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
