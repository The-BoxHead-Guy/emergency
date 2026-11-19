import { EmergencyHeader } from '@/react/components/EmergencyHeader';
import { EmptyState } from '@/react/components/EmptyState';
import { formatDateTime } from '@/core/date';
import { cls } from '@/react/classnames';
import { useScreenNavigation } from '@/react/screens/context';
import {
  formatContacts,
  formatHistoryRounds,
  formatMessages,
  historyCopy,
} from '@/react/screens/history/copy';
import { historyEntryById } from '@/react/screens/history/data';
import { EmergencyScreenLayout } from '@/react/screens/layout';
import type { EmergencyScreenProps } from '@/react/screens/types';

export const messageDetailCopy = {
  title: 'Detalle del mensaje',
  dateTime: 'Fecha y hora',
  kind: 'Tipo',
  responders: 'Contactos de emergencia',
  messages: 'Mensajes restantes',
  rounds: 'Rondas de avisos',
  notFound:
    'No encontramos este mensaje. Puede que ya no esté disponible en tu historial.',
  backToHistory: 'Volver al historial',
} as const;

export function MessageDetailScreen({
  titleId,
  locale,
  credits,
  onClose,
}: EmergencyScreenProps) {
  const { back, params, replace } = useScreenNavigation();
  const entry = historyEntryById(params.messageId, credits.history);
  const header = (
    <EmergencyHeader
      titleId={titleId}
      title={messageDetailCopy.title}
      variant="administrative"
      onClose={() => onClose('close')}
      onBack={back}
    />
  );

  if (!entry) {
    return (
      <EmergencyScreenLayout
        screen="message-detail"
        titleId={titleId}
        bodyClassName="emergency-panel__body--message-detail"
        header={header}
        footer={null}
      >
        <div className={cls('emergency-message-detail__empty')}>
          <EmptyState message={messageDetailCopy.notFound} />
          <button
            type="button"
            className={cls('emergency-message-detail__back')}
            onClick={() => replace('history')}
          >
            {messageDetailCopy.backToHistory}
          </button>
        </div>
      </EmergencyScreenLayout>
    );
  }

  return (
    <EmergencyScreenLayout
      screen="message-detail"
      titleId={titleId}
      bodyClassName="emergency-panel__body--message-detail"
      header={header}
      footer={null}
    >
      <div className={cls('emergency-message-detail')}>
        <div className={cls('emergency-message-detail__card')}>
          <div className={cls('emergency-message-detail__card-header')}>
            <h3 className={cls('emergency-message-detail__card-title')}>
              {messageDetailCopy.title}
            </h3>
          </div>
          <dl className={cls('emergency-message-detail__list')}>
            <div className={cls('emergency-message-detail__row')}>
              <dt className={cls('emergency-message-detail__label')}>
                {messageDetailCopy.dateTime}
              </dt>
              <dd className={cls('emergency-message-detail__value')}>
                {formatDateTime(entry.createdAt, locale)}
              </dd>
            </div>
            <div className={cls('emergency-message-detail__row')}>
              <dt className={cls('emergency-message-detail__label')}>
                {messageDetailCopy.kind}
              </dt>
              <dd className={cls('emergency-message-detail__value')}>
                {historyCopy.kindLabels[entry.kind]}
              </dd>
            </div>
            <div className={cls('emergency-message-detail__row')}>
              <dt className={cls('emergency-message-detail__label')}>
                {messageDetailCopy.responders}
              </dt>
              <dd className={cls('emergency-message-detail__value')}>
                {formatContacts(entry.contactsCount)}
              </dd>
            </div>
            <div className={cls('emergency-message-detail__row')}>
              <dt className={cls('emergency-message-detail__label')}>
                {messageDetailCopy.messages}
              </dt>
              <dd className={cls('emergency-message-detail__value')}>
                {formatMessages(entry.balanceAfter)}
              </dd>
            </div>
            <div className={cls('emergency-message-detail__row')}>
              <dt className={cls('emergency-message-detail__label')}>
                {messageDetailCopy.rounds}
              </dt>
              <dd className={cls('emergency-message-detail__value')}>
                {formatHistoryRounds(entry.rounds)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </EmergencyScreenLayout>
  );
}
