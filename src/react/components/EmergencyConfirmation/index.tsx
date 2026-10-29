import { useEffect, useId, useRef } from 'react';
import { copy } from '@/core/copy';
import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';

export interface EmergencyConfirmationProps {
  abortConfirmation: boolean;
  simulationConfirmation: boolean;
  onCancelAbort: () => void;
  onCancelSimulation: () => void;
  onConfirmAbort: () => void;
  onConfirmSimulation: () => void;
}

export function EmergencyConfirmation(props: EmergencyConfirmationProps) {
  const {
    abortConfirmation,
    simulationConfirmation,
    onCancelAbort,
    onCancelSimulation,
    onConfirmAbort,
    onConfirmSimulation,
  } = props;
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const danger = abortConfirmation;
  const open = abortConfirmation || simulationConfirmation;

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

  return (
    <div
      className={cls('emergency-confirmation')}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={cardRef}
        className={cls(
          'emergency-confirmation__card',
          danger && 'emergency-confirmation__card--danger',
        )}
      >
        <div className={cls('emergency-confirmation__icon')}>
          <Icon name={danger ? 'alert-triangle' : 'info'} />
        </div>
        <h3 className={cls('emergency-confirmation__title')} id={titleId}>
          {title}
        </h3>
        <p className={cls('emergency-confirmation__text')}>{text}</p>
        <div className={cls('emergency-confirmation__actions')}>
          <button
            type="button"
            className={cls(
              'emergency-confirmation__button',
              'emergency-confirmation__button--cancel',
            )}
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
            onClick={danger ? onConfirmAbort : onConfirmSimulation}
          >
            {danger ? copy.abortConfirm : copy.simulateConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
