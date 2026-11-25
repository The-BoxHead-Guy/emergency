import type { CSSProperties, ReactNode } from 'react';
import { cls } from '@/react/classnames';

const PLACEHOLDER_ROWS = [0, 1, 2];

export interface SkeletonProps {
  readonly width?: CSSProperties['width'];
  readonly height?: CSSProperties['height'];
  readonly rounded?: boolean;
  readonly className?: string;
}

/** Decorative placeholder block used while a resource loads. */
export function Skeleton({
  width = '100%',
  height = '0.875rem',
  rounded = false,
  className,
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cls(
        'emergency-skeleton',
        rounded && 'emergency-skeleton--rounded',
        className ?? null,
      )}
      style={{ width, height }}
    />
  );
}

/** Announces a loading region and hides its decorative children. */
export function SkeletonStatus({
  label,
  children,
  className,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={cls(className ?? null)}>
      <span className={cls('emergency-panel__sr-only')}>{label}</span>
      {children}
    </div>
  );
}

/** Three placeholder movement rows shared by the history skeletons. */
export function SkeletonList() {
  return (
    <ul
      className={cls('emergency-collapsibles', 'emergency-skeleton-list')}
      aria-hidden="true"
    >
      {PLACEHOLDER_ROWS.map((row) => (
        <li key={row} className={cls('emergency-skeleton-row')}>
          <Skeleton width="35%" />
          <Skeleton width="18%" />
        </li>
      ))}
    </ul>
  );
}
