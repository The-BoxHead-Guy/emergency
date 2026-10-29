import type { EmergencyPhaseName } from '@/core/types';
import { EmergencyPanel } from '@/react/components/EmergencyPanel';
import { EmergencyResumeNotification } from '@/react/components/EmergencyResumeNotification';
import { useEmergencyController } from '@/react/hooks/useEmergencyController';
import { useEmergencyStore } from '@/react/hooks/useEmergencyStore';

const BUSY_PHASES: readonly EmergencyPhaseName[] = [
  'initializing',
  'activating',
  'simulating',
  'aborting',
];

export function EmergencyRoot() {
  const client = useEmergencyController();
  const panelOpen = useEmergencyStore((state) => state.panelOpen);
  const phase = useEmergencyStore((state) => state.phase);
  const config = useEmergencyStore((state) => state.config);
  const snapshot = useEmergencyStore((state) => state.snapshot);
  const responders = useEmergencyStore((state) => state.responders);
  const resumeAvailable = useEmergencyStore((state) => state.resumeAvailable);
  const geolocationError = useEmergencyStore((state) => state.geolocationError);
  const lastError = useEmergencyStore((state) => state.lastError);
  const abortResult = useEmergencyStore((state) => state.abortResult);
  const simulationResult = useEmergencyStore((state) => state.simulationResult);
  const abortConfirmation = useEmergencyStore(
    (state) => state.abortConfirmation,
  );
  const simulationConfirmation = useEmergencyStore(
    (state) => state.simulationConfirmation,
  );

  const active = snapshot?.active === true;
  const busy = BUSY_PHASES.includes(phase.kind);
  const showError =
    phase.kind === 'error' ||
    (lastError !== null &&
      geolocationError === null &&
      abortResult === null &&
      simulationResult === null);
  const error = phase.kind === 'error' ? phase.error : lastError;

  return (
    <>
      <EmergencyResumeNotification
        resumeAvailable={resumeAvailable}
        onOpen={() => client.open('resume')}
      />
      <EmergencyPanel
        open={panelOpen}
        theme={config.theme}
        active={active}
        busy={busy}
        aborting={phase.kind === 'aborting'}
        loading={phase.kind === 'initializing' || phase.kind === 'activating'}
        locale={config.locale ?? 'es'}
        responders={responders}
        refreshing={phase.kind === 'refreshing'}
        geolocationError={geolocationError}
        error={showError ? error : null}
        fallback={config.fallback ?? null}
        abortResult={abortResult}
        simulationResult={simulationResult}
        abortConfirmation={abortConfirmation}
        simulationConfirmation={simulationConfirmation}
        onClose={(reason) => client.close(reason)}
        onActivate={() => {
          void client.activate();
        }}
        onRefresh={() => {
          void client.refresh();
        }}
        onRetry={() => {
          void client.activate();
        }}
        onDismissFeedback={() => client.dismissFeedback()}
        onRequestAbort={() => client.requestAbortConfirmation()}
        onRequestSimulation={() => client.requestSimulationConfirmation()}
        onCancelAbort={() => client.cancelAbortConfirmation()}
        onCancelSimulation={() => client.cancelSimulationConfirmation()}
        onConfirmAbort={() => {
          void client.abort();
        }}
        onConfirmSimulation={() => {
          void client.simulate();
        }}
      />
    </>
  );
}
