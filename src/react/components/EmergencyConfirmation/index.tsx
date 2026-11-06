import { useEffect, useId, useRef } from 'react';
import { copy } from '@/core/copy';
import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';

export interface EmergencyConfirmationProps {
  abortConfirmation: boolean;
  simulationConfirmation: boolean;
  loading: boolean;
  onCancelAbort: () => void;
  onCancelSimulation: () => void;
  onConfirmAbort: () => void;
  onConfirmSimulation: () => void;
}

export function EmergencyConfirmation(props: EmergencyConfirmationProps) {
  const {
    abortConfirmation,
    simulationConfirmation,
    loading,
    onCancelAbort,
    onCancelSimulation,
    onConfirmAbort,
    onConfirmSimulation,
  } = props;
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const danger = abortConfirmation;
  const open = abortConfirmation || simulationConfirmation;
  const pending = open && loading;

  useEffect(() => {
    if (open) {
      cardRef.current?.querySelector('button')?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const title = danger ? copy.abortConfirmTitle : copy.simulateConfirmTitle;
  const text = danger ? copy.abortConfirmText : copy.simulateConfirmText;
  const tone = danger ? 'danger' : 'information';

  return (
    <div
      className={cls('emergency-confirmation')}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-busy={pending}
    >
      <div ref={cardRef} className={cls('emergency-confirmation__card')}>
        <span
          className={cls('emergency-panel__sr-only')}
          role="status"
          aria-live="polite"
        >
          {pending ? copy.loading : ''}
        </span>
        <div className={cls('emergency-confirmation__body')}>
          <div
            className={cls(
              'emergency-confirmation__icon',
              `emergency-confirmation__icon--${tone}`,
            )}
          >
            <Icon name={danger ? 'alert-triangle' : 'info'} />
          </div>
          <h5 className={cls('emergency-confirmation__title')} id={titleId}>
            {title}
          </h5>
          <p className={cls('emergency-confirmation__text')}>{text}</p>
        </div>
        <div className={cls('emergency-confirmation__footer')}>
          <button
            type="button"
            className={cls(
              'emergency-confirmation__button',
              'emergency-confirmation__button--cancel',
            )}
            disabled={pending}
            onClick={danger ? onCancelAbort : onCancelSimulation}
          >
            {danger ? copy.abortCancel : copy.simulateCancel}
          </button>
          <button
            type="button"
            className={cls(
              'emergency-confirmation__button',
              danger
                ? 'emergency-confirmation__button--danger'
                : 'emergency-confirmation__button--confirm',
            )}
            aria-busy={pending}
            disabled={pending}
            onClick={danger ? onConfirmAbort : onConfirmSimulation}
          >
            {pending ? (
              <span
                className={cls('emergency-confirmation__spinner')}
                aria-hidden="true"
              />
            ) : null}
            <span>{danger ? copy.abortConfirm : copy.simulateConfirm}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
