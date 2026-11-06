import { ParamedicalMark } from '@/react/components/icons/paramedical-mark';
import { copy } from '@/core/copy';
import type {
  AbortResult,
  EmergencyError,
  Responder,
  SimulationResult,
} from '@/core/types';
import { EmergencyError as EmergencyErrorBlock } from '@/react/components/EmergencyError';
import { EmergencyFeedback } from '@/react/components/EmergencyFeedback';
import { EmergencyLoading } from '@/react/components/EmergencyLoading';
import { EmergencyStatusPanel } from '@/react/components/EmergencyStatusPanel';
import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';
import { Availability } from '@/react/screens/primary/Availability';

export interface EmergencyBodyProps {
  active: boolean;
  responders: readonly Responder[];
  refreshing: boolean;
  loading: boolean;
  locale: string;
  geolocationError: EmergencyError | null;
  activationError?: EmergencyError | null;
  error: EmergencyError | null;
  abortResult: AbortResult | null;
  simulationResult: SimulationResult | null;
  onRefresh: () => void;
  onRetry: () => void;
  onDismissFeedback: () => void;
  onRecharge: () => void;
  onDetails: () => void;
  onClose: () => void;
}

export function EmergencyBody(props: EmergencyBodyProps) {
  const {
    active,
    responders,
    refreshing,
    loading,
    locale,
    geolocationError,
    activationError,
    error,
    abortResult,
    simulationResult,
    onRefresh,
    onRetry,
    onDismissFeedback,
    onRecharge,
    onDetails,
    onClose,
  } = props;

  const showingFeedback =
    geolocationError !== null ||
    Boolean(activationError) ||
    abortResult !== null ||
    simulationResult !== null;
  const idle = !active && !loading && !showingFeedback && error === null;

  return (
    <div
      className={cls(
        'emergency-panel__body-split',
        idle && 'emergency-panel__body-split--with-availability',
      )}
    >
      {idle ? (
        <div className={cls('emergency-panel__availability-region')}>
          <Availability onRecharge={onRecharge} onDetails={onDetails} />
        </div>
      ) : null}

      <div
        className={cls(
          'emergency-panel__prompt-region',
          idle && 'emergency-panel__prompt-region--idle',
        )}
      >
        {idle ? (
          <button
            type="button"
            className={cls(
              'emergency-panel__close-button',
              'emergency-panel__close-button--prompt',
            )}
            aria-label={copy.close}
            onClick={onClose}
          >
            <Icon name="close" className={cls('emergency-panel__close-icon')} />
          </button>
        ) : null}

        {!loading && !showingFeedback ? (
          <div className={cls('sos-img__container')} id="sos-img__container">
            <ParamedicalMark
              className={cls('sos-img')}
              title={copy.illustrationAlt}
            />
          </div>
        ) : null}

        {active || loading || showingFeedback ? null : (
          <div className={cls('emergency-panel__body-title-container')}>
            <h4 className={cls('emergency-panel__body-title')}>
              {copy.question}
            </h4>
          </div>
        )}

        {active && !showingFeedback ? (
          <EmergencyStatusPanel
            responders={responders}
            refreshing={refreshing}
            locale={locale}
            onRefresh={onRefresh}
          />
        ) : null}

        {loading ? <EmergencyLoading /> : null}

        {error ? <EmergencyErrorBlock error={error} onRetry={onRetry} /> : null}

        <EmergencyFeedback
          abortResult={abortResult}
          simulationResult={simulationResult}
          geolocationError={geolocationError}
          activationError={activationError}
          onDismiss={onDismissFeedback}
        />
      </div>
    </div>
  );
}
