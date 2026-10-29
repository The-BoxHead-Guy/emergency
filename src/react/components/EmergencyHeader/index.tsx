import { copy } from '@/core/copy';
import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';

interface EmergencyHeaderProps {
  readonly titleId: string;
  readonly onClose: () => void;
}

export function EmergencyHeader({ titleId, onClose }: EmergencyHeaderProps) {
  return (
    <header className={cls('emergency-panel__header')}>
      <h2 className={cls('emergency-panel__title')} id={titleId}>
        {copy.panelLabel}
      </h2>
      <button
        type="button"
        className={cls('emergency-panel__close-button')}
        aria-label={copy.close}
        onClick={onClose}
      >
        <Icon name="close" className={cls('emergency-panel__close-icon')} />
      </button>
    </header>
  );
}
