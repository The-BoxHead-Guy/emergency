import type { ReactNode } from 'react';
import { cls } from '@/react/classnames';

export interface MovementRow {
  readonly label: string;
  readonly value: ReactNode;
}

export interface MovementRowsProps {
  readonly rows: readonly MovementRow[];
}

/** Property/value rows shared by top-up cards and alert collapsible bodies. */
export function MovementRows({ rows }: MovementRowsProps) {
  return (
    <dl className={cls('emergency-movement-rows')}>
      {rows.map((row) => (
        <div className={cls('emergency-movement-row')} key={row.label}>
          <dt className={cls('emergency-movement-row__label')}>{row.label}</dt>
          <dd className={cls('emergency-movement-row__value')}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
