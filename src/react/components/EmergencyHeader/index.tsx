import { copy } from '@/core/copy';
import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';

interface EmergencyHeaderProps {
  readonly titleId: string;
  readonly onClose: () => void;
  readonly title?: string;
  readonly onBack?: () => void;
  readonly variant?: 'default' | 'close-only';
}

export function EmergencyHeader({
  titleId,
  onClose,
  title = copy.panelLabel,
  onBack,
  variant = 'default',
}: EmergencyHeaderProps) {
  const closeOnly = variant === 'close-only';

  return (
    <header
      className={cls(
        'emergency-panel__header',
        closeOnly && 'emergency-panel__header--close-only',
      )}
    >
      {onBack && !closeOnly ? (
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
      <h2
        className={cls(
          'emergency-panel__title',
          closeOnly && 'emergency-panel__sr-only',
        )}
        id={titleId}
        tabIndex={-1}
      >
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
