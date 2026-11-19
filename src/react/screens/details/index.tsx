import type { CreditHistoryEntry } from '@/core/credits';
import { EmergencyHeader } from '@/react/components/EmergencyHeader';
import { EmptyState } from '@/react/components/EmptyState';
import { cls } from '@/react/classnames';
import { useScreenNavigation } from '@/react/screens/context';
import { AlertBalanceSentence } from '@/react/screens/details/AlertBalanceSentence';
import { detailsCopy } from '@/react/screens/details/copy';
import { AlertHistoryRow } from '@/react/screens/history/AlertHistoryRow';
import {
  HISTORY_PREVIEW_SIZE,
  partitionHistory,
  sortedHistoryEntries,
} from '@/react/screens/history/data';
import { creditResourceView } from '@/react/screens/credits-view';
import { EmergencyScreenLayout } from '@/react/screens/layout';
import type { EmergencyScreenProps } from '@/react/screens/types';

interface DetailsHistorySectionProps {
  readonly title: string;
  readonly subtitle: string;
  readonly empty: string;
  readonly emptyState: string | null;
  readonly entries: readonly CreditHistoryEntry[];
  readonly locale: string;
  readonly onOpen: (id: string) => void;
}

function DetailsHistorySection({
  title,
  subtitle,
  empty,
  emptyState,
  entries,
  locale,
  onOpen,
}: DetailsHistorySectionProps) {
  return (
    <section className={cls('emergency-details__section')} aria-label={title}>
      <div className={cls('emergency-details__heading')}>
        <h3 className={cls('emergency-details__title')}>{title}</h3>
        <p className={cls('emergency-details__subtitle')}>{subtitle}</p>
      </div>

      {entries.length > 0 ? (
        <ul className={cls('emergency-details__list')}>
          {entries.map((entry) => (
            <AlertHistoryRow
              key={entry.id}
              entry={entry}
              locale={locale}
              onOpen={onOpen}
            />
          ))}
        </ul>
      ) : (
        <EmptyState message={emptyState ?? empty} />
      )}
    </section>
  );
}

export function DetailsScreen({
  titleId,
  locale,
  credits,
  onClose,
}: EmergencyScreenProps) {
  const { back, navigate } = useScreenNavigation();
  const sorted = sortedHistoryEntries(credits.history);
  const { alerts, topUps } = partitionHistory(sorted);
  const alertEntries = alerts.slice(0, HISTORY_PREVIEW_SIZE);
  const topUpEntries = topUps.slice(0, HISTORY_PREVIEW_SIZE);
  const summaryView = creditResourceView(
    credits.summaryStatus,
    credits.credit !== null,
  );
  const historyView = creditResourceView(
    credits.historyStatus,
    sorted.length > 0,
  );
  const emptyState =
    historyView === 'loading'
      ? detailsCopy.summaryLoading
      : historyView === 'error'
        ? detailsCopy.summaryUnavailable
        : null;
  const openMessage = (messageId: string) => {
    navigate('message-detail', { messageId });
  };

  return (
    <EmergencyScreenLayout
      screen="details"
      titleId={titleId}
      bodyClassName="emergency-panel__body--details"
      header={
        <EmergencyHeader
          titleId={titleId}
          title={detailsCopy.title}
          variant="administrative"
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
          <div
            className={cls(
              'emergency-details__card',
              'emergency-details__card--availability',
            )}
          >
            <div className={cls('emergency-details__card-header')}>
              <h3 className={cls('emergency-details__card-title')}>
                {detailsCopy.summaryTitle}
              </h3>
            </div>
            <div className={cls('emergency-details__card-body')}>
              {credits.credit ? (
                <p className={cls('emergency-details__balance')}>
                  <AlertBalanceSentence
                    messages={credits.credit.balance}
                    responders={credits.credit.contactsCount}
                    rounds={credits.credit.rounds}
                    extraAlerts={credits.credit.extraAlerts}
                  />
                </p>
              ) : (
                <EmptyState
                  message={
                    summaryView === 'loading'
                      ? detailsCopy.summaryLoading
                      : summaryView === 'error'
                        ? detailsCopy.summaryUnavailable
                        : detailsCopy.summaryEmpty
                  }
                />
              )}
            </div>
          </div>
        </section>

        <DetailsHistorySection
          title={detailsCopy.alertsTitle}
          subtitle={detailsCopy.alertsSubtitle}
          empty={detailsCopy.alertsEmpty}
          emptyState={emptyState}
          entries={alertEntries}
          locale={locale}
          onOpen={openMessage}
        />

        <DetailsHistorySection
          title={detailsCopy.topUpTitle}
          subtitle={detailsCopy.topUpSubtitle}
          empty={detailsCopy.topUpEmpty}
          emptyState={emptyState}
          entries={topUpEntries}
          locale={locale}
          onOpen={openMessage}
        />

        <button
          type="button"
          className={cls('emergency-details__history-button')}
          onClick={() => navigate('history')}
        >
          {detailsCopy.viewHistory}
        </button>
      </div>
    </EmergencyScreenLayout>
  );
}
