import {
  Skeleton,
  SkeletonList,
  SkeletonStatus,
} from '@/react/components/Skeleton';
import { cls } from '@/react/classnames';
import { historyCopy } from '@/react/screens/history/copy';

function SummaryPlaceholder() {
  return (
    <section className={cls('emergency-history__summary')} aria-hidden="true">
      <div className={cls('emergency-history__summary-title-group')}>
        <Skeleton width="4rem" />
      </div>
      <div className={cls('emergency-history__summary-body')}>
        <Skeleton width="55%" />
        <Skeleton width="70%" />
        <Skeleton width="45%" />
      </div>
    </section>
  );
}

function HeadingPlaceholder() {
  return (
    <div className={cls('emergency-history__heading')} aria-hidden="true">
      <Skeleton width="45%" height="1.125rem" />
      <Skeleton width="70%" height="0.75rem" />
    </div>
  );
}

/** Placeholder for the available-balance card. */
export function HistorySummarySkeleton() {
  return (
    <SkeletonStatus label={historyCopy.loading}>
      <SummaryPlaceholder />
    </SkeletonStatus>
  );
}

/** Placeholder for the alert movement list. */
export function HistoryListSkeleton() {
  return (
    <SkeletonStatus label={historyCopy.loading}>
      <SkeletonList />
    </SkeletonStatus>
  );
}

/** Placeholder for the whole history screen on first load. */
export function HistorySkeleton() {
  return (
    <SkeletonStatus
      label={historyCopy.loading}
      className="emergency-skeleton-stack--history"
    >
      <SummaryPlaceholder />
      <HeadingPlaceholder />
      <SkeletonList />
    </SkeletonStatus>
  );
}
