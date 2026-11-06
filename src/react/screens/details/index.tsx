import { EmergencyHeader } from '@/react/components/EmergencyHeader';
import { cls } from '@/react/classnames';
import { useScreenNavigation } from '@/react/screens/context';
import { AlertBalanceSentence } from '@/react/screens/details/AlertBalanceSentence';
import { detailsCopy } from '@/react/screens/details/copy';
import { AlertHistoryRow } from '@/react/screens/history/AlertHistoryRow';
import {
  currentAlertBalance,
  HISTORY_PREVIEW_SIZE,
  sortedHistoryEntries,
} from '@/react/screens/history/data';
import { EmergencyScreenLayout } from '@/react/screens/layout';
import type { EmergencyScreenProps } from '@/react/screens/types';

export function DetailsScreen({
  titleId,
  locale,
  onClose,
}: EmergencyScreenProps) {
  const { back, navigate } = useScreenNavigation();
  const balance = currentAlertBalance();
  const preview = sortedHistoryEntries().slice(0, HISTORY_PREVIEW_SIZE);

  return (
    <EmergencyScreenLayout
      screen="details"
      titleId={titleId}
      bodyClassName="emergency-panel__body--details"
      header={
        <EmergencyHeader
          titleId={titleId}
          title={detailsCopy.title}
          onClose={() => onClose('close')}
          onBack={back}
        />
      }
      footer={null}
    >
      <div className={cls('emergency-details')}>
        <section
          className={cls('emergency-details__section')}
          aria-label={detailsCopy.summaryTitle}
        >
          <div className={cls('emergency-details__card')}>
            <div className={cls('emergency-details__card-header')}>
              <h3 className={cls('emergency-details__card-title')}>
                {detailsCopy.summaryTitle}
              </h3>
            </div>
            <div className={cls('emergency-details__card-body')}>
              {balance ? (
                <p className={cls('emergency-details__balance')}>
                  <AlertBalanceSentence
                    messages={balance.messages}
                    responders={balance.responders}
                  />
                </p>
              ) : (
                <p className={cls('emergency-details__empty')}>
                  {detailsCopy.summaryEmpty}
                </p>
              )}
            </div>
          </div>
        </section>

        <section
          className={cls('emergency-details__section')}
          aria-label={detailsCopy.historyTitle}
        >
          <div className={cls('emergency-details__heading')}>
            <h3 className={cls('emergency-details__title')}>
              {detailsCopy.historyTitle}
            </h3>
            <p className={cls('emergency-details__subtitle')}>
              {detailsCopy.historySubtitle}
            </p>
          </div>

          {preview.length > 0 ? (
            <ul className={cls('emergency-details__list')}>
              {preview.map((entry) => (
                <AlertHistoryRow
                  key={entry.id}
                  entry={entry}
                  locale={locale}
                  onOpen={(messageId) =>
                    navigate('message-detail', { messageId })
                  }
                />
              ))}
            </ul>
          ) : (
            <p className={cls('emergency-details__empty')}>
              {detailsCopy.historyEmpty}
            </p>
          )}

          <button
            type="button"
            className={cls('emergency-details__history-button')}
            onClick={() => navigate('history')}
          >
            {detailsCopy.viewHistory}
          </button>
        </section>
      </div>
    </EmergencyScreenLayout>
  );
}
