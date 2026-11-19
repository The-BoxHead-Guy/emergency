import { useId, useState } from 'react';
import { EmergencyHeader } from '@/react/components/EmergencyHeader';
import { EmptyState } from '@/react/components/EmptyState';
import { cls } from '@/react/classnames';
import { useScreenNavigation } from '@/react/screens/context';
import { creditResourceView } from '@/react/screens/credits-view';
import { AlertHistoryRow } from '@/react/screens/history/AlertHistoryRow';
import { historyCopy } from '@/react/screens/history/copy';
import {
  HISTORY_PREVIEW_SIZE,
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
  const { back, navigate } = useScreenNavigation();
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  const entries = sortedHistoryEntries(credits.history);
  const hiddenCount = Math.max(0, entries.length - HISTORY_PREVIEW_SIZE);
  const visibleEntries = expanded
    ? entries
    : entries.slice(0, HISTORY_PREVIEW_SIZE);
  const showMore = hiddenCount > 0 && !expanded;
  const view = creditResourceView(credits.historyStatus, entries.length > 0);

  return (
    <EmergencyScreenLayout
      screen="history"
      titleId={titleId}
      bodyClassName="emergency-panel__body--history"
      header={
        <EmergencyHeader
          titleId={titleId}
          title={historyCopy.title}
          variant="administrative"
          onClose={() => onClose('close')}
          onBack={back}
        />
      }
      footer={null}
    >
      <div className={cls('emergency-history')}>
        <div className={cls('emergency-history__heading')}>
          <h3 className={cls('emergency-history__title')}>
            {historyCopy.title}
          </h3>
          <p className={cls('emergency-history__subtitle')}>
            {historyCopy.subtitle}
          </p>
        </div>

        {entries.length > 0 ? (
          <>
            <ul className={cls('emergency-history__list')} id={listId}>
              {visibleEntries.map((entry) => (
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
                  : historyCopy.empty
            }
          />
        )}
      </div>
    </EmergencyScreenLayout>
  );
}
