import { ParamedicalMark } from '@/styles/assets/paramedical-mark';
import { copy } from '@/core/copy';
import type {
  AbortResult,
  EmergencyError,
  EmergencyFallback as EmergencyFallbackTarget,
  Responder,
  SimulationResult,
} from '@/core/types';
import { EmergencyError as EmergencyErrorBlock } from '@/react/components/EmergencyError';
import { EmergencyFallback } from '@/react/components/EmergencyFallback';
import { EmergencyFeedback } from '@/react/components/EmergencyFeedback';
import { EmergencyLoading } from '@/react/components/EmergencyLoading';
import { EmergencyStatusPanel } from '@/react/components/EmergencyStatusPanel';
import { cls } from '@/react/classnames';

export interface EmergencyBodyProps {
  active: boolean;
  responders: readonly Responder[];
  refreshing: boolean;
  loading: boolean;
  locale: string;
  geolocationError: EmergencyError | null;
  error: EmergencyError | null;
  fallback: EmergencyFallbackTarget | null;
  abortResult: AbortResult | null;
  simulationResult: SimulationResult | null;
  onRefresh: () => void;
  onRetry: () => void;
  onDismissFeedback: () => void;
}

export function EmergencyBody(props: EmergencyBodyProps) {
  const {
    active,
    responders,
    refreshing,
    loading,
    locale,
    geolocationError,
    error,
    fallback,
    abortResult,
    simulationResult,
    onRefresh,
    onRetry,
    onDismissFeedback,
  } = props;

  return (
    <>
      <div className={cls('sos-img__container')} id="sos-img__container">
        <ParamedicalMark
          className={cls('sos-img')}
          title={copy.illustrationAlt}
        />
      </div>

      {active ? null : (
        <div className={cls('emergency-panel__body-title-container')}>
          <h4 className={cls('emergency-panel__body-title')}>
            {copy.question}
          </h4>
        </div>
      )}

      {active ? (
        <EmergencyStatusPanel
          responders={responders}
          refreshing={refreshing}
          locale={locale}
          onRefresh={onRefresh}
        />
      ) : null}

      {loading ? <EmergencyLoading /> : null}

      {geolocationError ? (
        <EmergencyFallback fallback={fallback} error={geolocationError} />
      ) : null}

      {error ? <EmergencyErrorBlock error={error} onRetry={onRetry} /> : null}

      <EmergencyFeedback
        abortResult={abortResult}
        simulationResult={simulationResult}
        onDismiss={onDismissFeedback}
      />
    </>
  );
}
