import type { ReactNode } from 'react';
import { EmergencyHeader } from '@/react/components/EmergencyHeader';
import { EmptyState } from '@/react/components/EmptyState';
import { cls } from '@/react/classnames';
import { useCreditsRefresh } from '@/react/hooks/useCreditsRefresh';
import { useScreenNavigation } from '@/react/screens/context';
import { AlertBalanceSentence } from '@/react/screens/details/AlertBalanceSentence';
import { detailsCopy } from '@/react/screens/details/copy';
import {
  DetailsAvailabilitySkeleton,
  DetailsSkeleton,
  DetailsSectionSkeleton,
} from '@/react/screens/details/DetailsSkeleton';
import { MovementList } from '@/react/screens/history/MovementList';
import {
  HISTORY_PREVIEW_SIZE,
  partitionHistory,
  sortedHistoryEntries,
} from '@/react/screens/history/data';
import {
  creditResourceView,
  isCreditResourcePending,
} from '@/react/screens/credits-view';
import { EmergencyScreenLayout } from '@/react/screens/layout';
import type { EmergencyScreenProps } from '@/react/screens/types';

interface DetailsHistorySectionProps {
  readonly title: string;
  readonly subtitle: string;
  readonly emptyMessage: string;
  readonly isEmpty: boolean;
  readonly pending?: boolean;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

function DetailsHistorySection({
  title,
  subtitle,
  emptyMessage,
  isEmpty,
  pending = false,
  footer,
  children,
}: DetailsHistorySectionProps) {
  return (
    <section className={cls('emergency-details__section')} aria-label={title}>
      <div className={cls('emergency-details__heading')}>
        <h3 className={cls('emergency-details__title')}>{title}</h3>
        <p className={cls('emergency-details__subtitle')}>{subtitle}</p>
      </div>

      {pending ? (
        <DetailsSectionSkeleton />
      ) : isEmpty ? (
        <EmptyState message={emptyMessage} />
      ) : (
        children
      )}
      {footer}
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
  useCreditsRefresh({ summary: true, history: true });
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
  const summaryPending = isCreditResourcePending(
    credits.summaryStatus,
    credits.credit !== null,
  );
  const historyPending = isCreditResourcePending(
    credits.historyStatus,
    sorted.length > 0,
  );
  const alertPending = isCreditResourcePending(
    credits.historyStatus,
    alertEntries.length > 0,
  );
  const topUpPending = isCreditResourcePending(
    credits.historyStatus,
    topUpEntries.length > 0,
  );

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
        {summaryPending && historyPending ? (
          <DetailsSkeleton />
        ) : (
          <>
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
                  {summaryPending ? (
                    <DetailsAvailabilitySkeleton />
                  ) : credits.credit ? (
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
              emptyMessage={emptyState ?? detailsCopy.alertsEmpty}
              isEmpty={alertEntries.length === 0}
              pending={alertPending}
              footer={
                <div className={cls('emergency-details__filters')}>
                  <button
                    type="button"
                    className={cls('emergency-details__filter')}
                    onClick={() => navigate('history', { filter: 'alerts' })}
                  >
                    {detailsCopy.alertsHistory}
                  </button>
                </div>
              }
            >
              <MovementList
                entries={alertEntries}
                locale={locale}
                filter="alerts"
              />
            </DetailsHistorySection>

            <DetailsHistorySection
              title={detailsCopy.topUpTitle}
              subtitle={detailsCopy.topUpSubtitle}
              emptyMessage={emptyState ?? detailsCopy.topUpEmpty}
              isEmpty={topUpEntries.length === 0}
              pending={topUpPending}
              footer={
                <div className={cls('emergency-details__filters')}>
                  <button
                    type="button"
                    className={cls('emergency-details__filter')}
                    onClick={() => navigate('history', { filter: 'top-ups' })}
                  >
                    {detailsCopy.topUpsHistory}
                  </button>
                </div>
              }
            >
              <MovementList
                entries={topUpEntries}
                locale={locale}
                filter="top-ups"
              />
            </DetailsHistorySection>
          </>
        )}
      </div>
    </EmergencyScreenLayout>
  );
}
