import { copy } from '@/core/copy';
import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';

export interface EmergencyFooterProps {
  active: boolean;
  busy: boolean;
  aborting: boolean;
  onActivate: () => void;
  onRequestAbort: () => void;
  onRequestSimulation: () => void;
}

export function EmergencyFooter(props: EmergencyFooterProps) {
  const {
    active,
    busy,
    aborting,
    onActivate,
    onRequestAbort,
    onRequestSimulation,
  } = props;

  if (active) {
    return (
      <footer className={cls('emergency-panel__footer')}>
        <button
          type="button"
          className={cls('emergency-status__abort-btn')}
          aria-label={copy.abort}
          disabled={aborting}
          onClick={onRequestAbort}
        >
          {copy.abort}
          <Icon name="alert-triangle" />
        </button>
      </footer>
    );
  }

  return (
    <footer className={cls('emergency-panel__footer')}>
      <button
        type="button"
        className={cls(
          'emergency-panel__button',
          'emergency-panel__button--emergency',
        )}
        aria-label={copy.emergencyAria}
        disabled={busy}
        onClick={onActivate}
      >
        {copy.emergency}
        <Icon name="emergency" />
      </button>

      <button
        type="button"
        className={cls(
          'emergency-panel__button',
          'emergency-panel__button--simulation',
        )}
        aria-label={copy.testAria}
        disabled={busy}
        onClick={onRequestSimulation}
      >
        {copy.test}
        <Icon name="list-check" />
      </button>
    </footer>
  );
}
