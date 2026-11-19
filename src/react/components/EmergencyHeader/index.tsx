import { copy } from '@/core/copy';
import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';

export type EmergencyHeaderVariant = 'emergency' | 'administrative';

interface EmergencyHeaderProps {
  readonly titleId: string;
  readonly onClose: () => void;
  readonly title?: string;
  readonly onBack?: () => void;
  readonly variant?: EmergencyHeaderVariant;
}

export function EmergencyHeader({
  titleId,
  onClose,
  title = copy.panelLabel,
  onBack,
  variant = 'emergency',
}: EmergencyHeaderProps) {
  return (
    <header className={cls('emergency-panel__header')} data-variant={variant}>
      {onBack ? (
        <button
          type="button"
          className={cls('emergency-panel__close-button')}
          aria-label={copy.back}
          onClick={onBack}
        >
          <Icon
            name="arrow-left"
            className={cls('emergency-panel__close-icon')}
          />
        </button>
      ) : null}
      <h2 className={cls('emergency-panel__title')} id={titleId} tabIndex={-1}>
        {title}
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
