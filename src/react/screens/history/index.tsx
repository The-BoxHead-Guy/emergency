import { useId, useState } from 'react';
import { EmergencyHeader } from '@/react/components/EmergencyHeader';
import { EmptyState } from '@/react/components/EmptyState';
import { cls } from '@/react/classnames';
import { useCreditsRefresh } from '@/react/hooks/useCreditsRefresh';
import { useScreenNavigation } from '@/react/screens/context';
import {
  creditResourceView,
  isCreditResourcePending,
} from '@/react/screens/credits-view';
import { historyCopy, historyFilterCopy } from '@/react/screens/history/copy';
import { MovementList } from '@/react/screens/history/MovementList';
import {
  HistoryListSkeleton,
  HistorySkeleton,
  HistorySummarySkeleton,
} from '@/react/screens/history/HistorySkeleton';
import { SummaryCard } from '@/react/screens/history/SummaryCard';
import {
  HISTORY_PREVIEW_SIZE,
  historyEntriesForFilter,
  partitionHistory,
  resolveHistoryFilter,
  sortedHistoryEntries,
} from '@/react/screens/history/data';
import { EmergencyScreenLayout } from '@/react/screens/layout';
import type { EmergencyScreenProps } from '@/react/screens/types';

export function HistoryScreen({
  titleId,
  locale,
  credits,
  onClose,
}: EmergencyScreenProps) {
  const { back, params } = useScreenNavigation();
  useCreditsRefresh({ summary: true, history: true });
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  const filter = resolveHistoryFilter(params.filter);
  const copy = historyFilterCopy[filter];
  const entries = historyEntriesForFilter(
    partitionHistory(sortedHistoryEntries(credits.history)),
    filter,
  );
  const hiddenCount = Math.max(0, entries.length - HISTORY_PREVIEW_SIZE);
  const visibleEntries = expanded
    ? entries
    : entries.slice(0, HISTORY_PREVIEW_SIZE);
  const showMore = hiddenCount > 0 && !expanded;
  const view = creditResourceView(credits.historyStatus, entries.length > 0);
  const summaryPending = isCreditResourcePending(
    credits.summaryStatus,
    credits.credit !== null,
  );
  const historyPending = isCreditResourcePending(
    credits.historyStatus,
    entries.length > 0,
  );

  return (
    <EmergencyScreenLayout
      screen="history"
      titleId={titleId}
      bodyClassName="emergency-panel__body--history"
      header={
        <EmergencyHeader
          titleId={titleId}
          title={copy.title}
          variant="administrative"
          onClose={() => onClose('close')}
          onBack={back}
        />
      }
      footer={null}
    >
      <div className={cls('emergency-history')}>
        {summaryPending && historyPending ? (
          <HistorySkeleton />
        ) : (
          <>
            {summaryPending ? (
              <HistorySummarySkeleton />
            ) : (
              <SummaryCard credits={credits} />
            )}

            <div className={cls('emergency-history__heading')}>
              <h3 className={cls('emergency-history__title')}>{copy.title}</h3>
              <p className={cls('emergency-history__subtitle')}>
                {historyCopy.subtitle}
              </p>
            </div>

            {historyPending ? (
              <HistoryListSkeleton />
            ) : entries.length > 0 ? (
              <>
                <MovementList
                  entries={visibleEntries}
                  locale={locale}
                  filter={filter}
                  id={listId}
                />

                {showMore ? (
                  <button
                    type="button"
                    className={cls('emergency-history__more')}
                    aria-expanded={expanded}
                    aria-controls={listId}
                    onClick={() => setExpanded(true)}
                  >
                    {historyCopy.showMore}
                  </button>
                ) : null}
              </>
            ) : (
              <EmptyState
                message={
                  view === 'loading'
                    ? historyCopy.loading
                    : view === 'error'
                      ? historyCopy.unavailable
                      : copy.empty
                }
              />
            )}
          </>
        )}
      </div>
    </EmergencyScreenLayout>
  );
}
