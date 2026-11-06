import { copy } from '@/core/copy';
import { EmergencyBody } from '@/react/components/EmergencyBody';
import { EmergencyFooter } from '@/react/components/EmergencyFooter';
import { EmergencyHeader } from '@/react/components/EmergencyHeader';
import { cls } from '@/react/classnames';
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
      bodyClassName={idle ? 'emergency-panel__body--primary' : undefined}
      header={
        idle ? null : (
          <EmergencyHeader
            titleId={props.titleId}
            onClose={() => props.onClose('close')}
          />
        )
      }
      footer={
        <EmergencyFooter
          active={props.active}
          busy={props.busy}
          aborting={props.aborting}
          feedbackVisible={props.feedbackVisible}
          square={idle}
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
      {idle ? (
        <h2
          className={cls('emergency-panel__sr-only')}
          id={props.titleId}
          tabIndex={-1}
        >
          {copy.panelLabel}
        </h2>
      ) : null}
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
        onClose={() => props.onClose('close')}
      />
    </EmergencyScreenLayout>
  );
}
