import { useCallback, useId, useRef } from 'react';
import type { CSSProperties } from 'react';
import { themeToCssVariables } from '@/core/mappers';
import type {
  AbortResult,
  EmergencyError,
  EmergencyFallback,
  EmergencyTheme,
  PanelCloseReason,
  Responder,
  SimulationResult,
} from '@/core/types';
import { EmergencyBody } from '@/react/components/EmergencyBody';
import { EmergencyConfirmation } from '@/react/components/EmergencyConfirmation';
import { EmergencyFooter } from '@/react/components/EmergencyFooter';
import { EmergencyHeader } from '@/react/components/EmergencyHeader';
import { cls } from '@/react/classnames';
import { useEscapeKey } from '@/react/hooks/useEscapeKey';
import { useFocusTrap } from '@/react/hooks/useFocusTrap';

export interface EmergencyPanelProps {
  open: boolean;
  theme?: EmergencyTheme;
  active: boolean;
  busy: boolean;
  aborting: boolean;
  loading: boolean;
  locale: string;
  responders: readonly Responder[];
  refreshing: boolean;
  geolocationError: EmergencyError | null;
  error: EmergencyError | null;
  fallback: EmergencyFallback | null;
  abortResult: AbortResult | null;
  simulationResult: SimulationResult | null;
  abortConfirmation: boolean;
  simulationConfirmation: boolean;
  onClose: (reason: PanelCloseReason) => void;
  onActivate: () => void;
  onRefresh: () => void;
  onRetry: () => void;
  onDismissFeedback: () => void;
  onRequestAbort: () => void;
  onRequestSimulation: () => void;
  onCancelAbort: () => void;
  onCancelSimulation: () => void;
  onConfirmAbort: () => void;
  onConfirmSimulation: () => void;
}

export function EmergencyPanel(props: EmergencyPanelProps) {
  const {
    open,
    theme,
    active,
    busy,
    aborting,
    loading,
    locale,
    responders,
    refreshing,
    geolocationError,
    error,
    fallback,
    abortResult,
    simulationResult,
    abortConfirmation,
    simulationConfirmation,
    onClose,
    onActivate,
    onRefresh,
    onRetry,
    onDismissFeedback,
    onRequestAbort,
    onRequestSimulation,
    onCancelAbort,
    onCancelSimulation,
    onConfirmAbort,
    onConfirmSimulation,
  } = props;
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const closeOnEscape = useCallback(() => {
    onClose('escape');
  }, [onClose]);

  useFocusTrap(dialogRef, open);
  useEscapeKey(open, closeOnEscape);

  return (
    <div
      ref={dialogRef}
      className={cls('emergency-panel', !open && 'emergency-panel--hidden')}
      // React types do not model custom `--*` properties without an assertion.
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      style={themeToCssVariables(theme) as CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-hidden={!open}
      inert={!open}
      tabIndex={-1}
    >
      <EmergencyHeader titleId={titleId} onClose={() => onClose('close')} />
      <section
        className={cls('emergency-panel__body')}
        aria-labelledby={titleId}
      >
        <EmergencyBody
          active={active}
          responders={responders}
          refreshing={refreshing}
          loading={loading}
          locale={locale}
          geolocationError={geolocationError}
          error={error}
          fallback={fallback}
          abortResult={abortResult}
          simulationResult={simulationResult}
          onRefresh={onRefresh}
          onRetry={onRetry}
          onDismissFeedback={onDismissFeedback}
        />
      </section>
      <EmergencyFooter
        active={active}
        busy={busy}
        aborting={aborting}
        onActivate={onActivate}
        onRequestAbort={onRequestAbort}
        onRequestSimulation={onRequestSimulation}
      />
      <EmergencyConfirmation
        abortConfirmation={abortConfirmation}
        simulationConfirmation={simulationConfirmation}
        onCancelAbort={onCancelAbort}
        onCancelSimulation={onCancelSimulation}
        onConfirmAbort={onConfirmAbort}
        onConfirmSimulation={onConfirmSimulation}
      />
    </div>
  );
}
