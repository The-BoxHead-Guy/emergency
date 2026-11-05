import { EmergencyBody } from '@/react/components/EmergencyBody';
import { EmergencyFooter } from '@/react/components/EmergencyFooter';
import { EmergencyHeader } from '@/react/components/EmergencyHeader';
import { useScreenNavigation } from '@/react/screens/context';
import { EmergencyScreenLayout } from '@/react/screens/layout';
import type { EmergencyScreenProps } from '@/react/screens/types';

export function PrimaryScreen(props: EmergencyScreenProps) {
  const { navigate } = useScreenNavigation();
  const idle =
    !props.active &&
    !props.loading &&
    !props.feedbackVisible &&
    props.error === null;
  const needsContactPhone = props.contactPhone === null;

  return (
    <EmergencyScreenLayout
      screen="primary"
      titleId={props.titleId}
      header={
        <EmergencyHeader
          titleId={props.titleId}
          variant={idle ? 'close-only' : 'default'}
          onClose={() => props.onClose('close')}
        />
      }
      footer={
        <EmergencyFooter
          active={props.active}
          busy={props.busy}
          aborting={props.aborting}
          feedbackVisible={props.feedbackVisible}
          onActivate={
            needsContactPhone
              ? () => navigate('pre-emergency')
              : props.onActivate
          }
          onRequestAbort={props.onRequestAbort}
          onRequestSimulation={props.onRequestSimulation}
        />
      }
    >
      <EmergencyBody
        active={props.active}
        responders={props.responders}
        refreshing={props.refreshing}
        loading={props.loading}
        locale={props.locale}
        geolocationError={props.geolocationError}
        activationError={props.activationError}
        error={props.error}
        abortResult={props.abortResult}
        simulationResult={props.simulationResult}
        onRefresh={props.onRefresh}
        onRetry={props.onRetry}
        onDismissFeedback={props.onDismissFeedback}
        onRecharge={() => navigate('pricing')}
        onDetails={() => navigate('details')}
      />
    </EmergencyScreenLayout>
  );
}
