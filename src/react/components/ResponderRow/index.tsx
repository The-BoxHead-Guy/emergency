import type { Responder } from '@/core/types';
import { EmergencyMessageRow } from '@/react/components/EmergencyMessageRow';
import { StatusCell } from '@/react/components/StatusCell';
import { cls } from '@/react/classnames';

export function ResponderRow({
  responder,
  locale,
}: {
  readonly responder: Responder;
  readonly locale: string;
}) {
  return (
    <div
      className={cls('emergency-status__row-container')}
      data-responder-id={responder.phone}
    >
      <div className={cls('emergency-status__row')}>
        <div className={cls('emergency-status__cell', 'responder-name')}>
          <p className={cls('emergency-status__cell-text')}>{responder.name}</p>
        </div>
        <StatusCell
          confirmed={responder.sent}
          timestamp={responder.sentAt}
          failed={responder.failed}
          isFailedIcon
          locale={locale}
        />
        <StatusCell
          confirmed={responder.delivered}
          timestamp={responder.deliveredAt}
          failed={responder.failed}
          locale={locale}
        />
        <StatusCell
          confirmed={responder.read}
          timestamp={responder.readAt}
          failed={responder.failed}
          locale={locale}
        />
      </div>
      <EmergencyMessageRow responder={responder} locale={locale} />
    </div>
  );
}
