import type { Responder } from '@/core/types';
import { copy } from '@/core/copy';
import { Icon } from '@/react/components/Icon';
import { ResponderRow } from '@/react/components/ResponderRow';
import { cls } from '@/react/classnames';

interface EmergencyStatusPanelProps {
  readonly responders: ReadonlyArray<Responder>;
  readonly refreshing: boolean;
  readonly locale: string;
  readonly onRefresh: () => void;
}

export function EmergencyStatusPanel({
  responders,
  refreshing,
  locale,
  onRefresh,
}: EmergencyStatusPanelProps) {
  const columns = [
    copy.responderColumn,
    copy.sentColumn,
    copy.deliveredColumn,
    copy.readColumn,
  ];

  return (
    <div className={cls('emergency-status__panel')}>
      <div className={cls('emergency-status-panel__header')}>
        <h3 className={cls('emergency-status-panel__title')}>
          {copy.statusTitle}
        </h3>
      </div>
      <div className={cls('emergency-status__grid')}>
        <div className={cls('emergency-status__header')}>
          {columns.map((column) => (
            <div className={cls('emergency-status__cell')} key={column}>
              <p className={cls('emergency-status__cell-text')}>{column}</p>
            </div>
          ))}
        </div>
        <div className={cls('emergency-status__body')}>
          {responders.map((responder) => (
            <ResponderRow
              key={`${responder.phone}-${responder.name}`}
              responder={responder}
              locale={locale}
            />
          ))}
          {responders.length === 0 ? (
            <p className={cls('emergency-status__cell-text')}>
              {copy.respondersEmpty}
            </p>
          ) : null}
        </div>
        <div className={cls('emergency-status-panel__refresh-btn-container')}>
          <button
            type="button"
            className={cls('emergency-status-panel__refresh-btn')}
            aria-label={copy.refresh}
            disabled={refreshing}
            onClick={onRefresh}
          >
            <Icon
              name="rotate"
              className={cls('emergency-status-panel__refresh-icon')}
            />
            <span className={cls('emergency-status-panel__refresh-text')}>
              {refreshing ? copy.refreshing : copy.refresh}
            </span>
          </button>
          {refreshing ? (
            <div
              className={cls('emergency-status__loading')}
              role="status"
              aria-live="polite"
            >
              <span
                className={cls('emergency-status__spinner')}
                aria-hidden="true"
              />
              <span className={cls('emergency-status__loading-text')}>
                {copy.refreshing}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
