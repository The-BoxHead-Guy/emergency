import { useCallback, useEffect, useId, useRef } from 'react';
import { themeToCssVariables } from '@/core/mappers';
import type {
  AbortResult,
  EmergencyError,
  EmergencyTheme,
  PanelCloseReason,
  Responder,
  SimulationResult,
} from '@/core/types';
import { EmergencyConfirmation } from '@/react/components/EmergencyConfirmation';
import { cls } from '@/react/classnames';
import { useEscapeKey } from '@/react/hooks/useEscapeKey';
import { useFocusTrap } from '@/react/hooks/useFocusTrap';
import {
  EmergencyScreenProvider,
  useScreenNavigation,
} from '@/react/screens/context';
import { screenRegistry } from '@/react/screens/registry';
import type { EmergencyScreenProps } from '@/react/screens/types';

export interface EmergencyPanelProps {
  open: boolean;
  theme?: EmergencyTheme;
  active: boolean;
  busy: boolean;
  aborting: boolean;
  simulating: boolean;
  loading: boolean;
  locale: string;
  responders: readonly Responder[];
  refreshing: boolean;
  geolocationError: EmergencyError | null;
  contactPhone: string | null;
  activationError?: EmergencyError | null;
  error: EmergencyError | null;
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
  onSetContactPhone: (phone: string | null) => void;
}

interface ActiveScreenProps {
  readonly screenProps: EmergencyScreenProps;
  readonly open: boolean;
  readonly forcePrimary: boolean;
}

function ActiveScreen({ screenProps, open, forcePrimary }: ActiveScreenProps) {
  const { screen, reset } = useScreenNavigation();
  const shouldReset = !open || forcePrimary;
  const effectiveScreen = shouldReset ? 'primary' : screen;
  const previousOpen = useRef(open);
  const previousScreen = useRef(effectiveScreen);

  useEffect(() => {
    if (shouldReset) {
      reset();
    }
  }, [reset, shouldReset]);

  useEffect(() => {
    const wasOpen = previousOpen.current;
    const previousEffectiveScreen = previousScreen.current;

    previousOpen.current = open;
    previousScreen.current = effectiveScreen;

    if (!open || !wasOpen || previousEffectiveScreen === effectiveScreen) {
      return;
    }

    document
      .getElementById(screenProps.titleId)
      ?.focus({ preventScroll: true });
  }, [effectiveScreen, open, screenProps.titleId]);

  const Screen = screenRegistry[effectiveScreen];

  return <Screen {...screenProps} />;
}

export function EmergencyPanel(props: EmergencyPanelProps) {
  const {
    open,
    theme,
    active,
    busy,
    aborting,
    simulating,
    loading,
    locale,
    responders,
    refreshing,
    geolocationError,
    contactPhone,
    activationError,
    error,
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
    onSetContactPhone,
  } = props;
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const feedbackVisible =
    geolocationError !== null ||
    Boolean(activationError) ||
    abortResult !== null ||
    simulationResult !== null;
  const forcePrimary = active || loading || error !== null || feedbackVisible;

  const closeOnEscape = useCallback(() => {
    onClose('escape');
  }, [onClose]);

  useFocusTrap(dialogRef, open);
  useEscapeKey(open, closeOnEscape);

  const screenProps: EmergencyScreenProps = {
    titleId,
    active,
    busy,
    aborting,
    loading,
    locale,
    responders,
    refreshing,
    geolocationError,
    activationError,
    error,
    abortResult,
    simulationResult,
    feedbackVisible,
    contactPhone,
    onClose,
    onActivate,
    onRefresh,
    onRetry,
    onDismissFeedback,
    onRequestAbort,
    onRequestSimulation,
    onSetContactPhone,
  };

  return (
    <div
      ref={dialogRef}
      className={cls('emergency-panel', !open && 'emergency-panel--hidden')}
      style={themeToCssVariables(theme)}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-hidden={!open}
      inert={!open}
      tabIndex={-1}
    >
      <EmergencyScreenProvider>
        <ActiveScreen
          screenProps={screenProps}
          open={open}
          forcePrimary={forcePrimary}
        />
      </EmergencyScreenProvider>
      <EmergencyConfirmation
        abortConfirmation={abortConfirmation}
        simulationConfirmation={simulationConfirmation}
        loading={abortConfirmation ? aborting : simulating}
        onCancelAbort={onCancelAbort}
        onCancelSimulation={onCancelSimulation}
        onConfirmAbort={onConfirmAbort}
        onConfirmSimulation={onConfirmSimulation}
      />
    </div>
  );
}
