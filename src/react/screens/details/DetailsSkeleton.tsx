import {
  Skeleton,
  SkeletonList,
  SkeletonStatus,
} from '@/react/components/Skeleton';
import { cls } from '@/react/classnames';
import { detailsCopy } from '@/react/screens/details/copy';

function AvailabilityPlaceholder() {
  return (
    <div
      className={cls(
        'emergency-details__card',
        'emergency-details__card--availability',
      )}
      aria-hidden="true"
    >
      <div className={cls('emergency-details__card-header')}>
        <Skeleton width="7rem" height="1rem" />
      </div>
      <div className={cls('emergency-details__card-body')}>
        <Skeleton width="90%" />
        <Skeleton width="70%" />
      </div>
    </div>
  );
}

function SectionPlaceholder({ withFilter }: { readonly withFilter: boolean }) {
  return (
    <div aria-hidden="true" className={cls('emergency-details__placeholder')}>
      <div className={cls('emergency-details__heading')}>
        <Skeleton width="35%" height="1.125rem" />
        <Skeleton width="65%" height="0.75rem" />
      </div>
      <SkeletonList />
      {withFilter ? (
        <div className={cls('emergency-details__filters')}>
          <Skeleton width="100%" height="2.75rem" rounded />
        </div>
      ) : null}
    </div>
  );
}

/** Placeholder for the availability card on the details screen. */
export function DetailsAvailabilitySkeleton() {
  return (
    <SkeletonStatus label={detailsCopy.summaryLoading}>
      <AvailabilityPlaceholder />
    </SkeletonStatus>
  );
}

/** Placeholder rows for one details history section. */
export function DetailsSectionSkeleton() {
  return (
    <SkeletonStatus label={detailsCopy.summaryLoading}>
      <SectionPlaceholder withFilter={false} />
    </SkeletonStatus>
  );
}

/** Placeholder for the whole details screen on first load. */
export function DetailsSkeleton() {
  return (
    <SkeletonStatus
      label={detailsCopy.summaryLoading}
      className="emergency-skeleton-stack--details"
    >
      <section className={cls('emergency-details__section')}>
        <AvailabilityPlaceholder />
      </section>
      <section className={cls('emergency-details__section')}>
        <SectionPlaceholder withFilter />
      </section>
      <section className={cls('emergency-details__section')}>
        <SectionPlaceholder withFilter />
      </section>
    </SkeletonStatus>
  );
}
