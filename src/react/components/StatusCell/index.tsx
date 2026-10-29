import { formatShortTime } from '@/core/date';
import { StatusIcon } from '@/react/components/StatusIcon';
import { cls } from '@/react/classnames';

interface StatusCellProps {
  readonly confirmed: boolean;
  readonly timestamp: string | null;
  readonly failed?: boolean;
  readonly isFailedIcon?: boolean;
  readonly locale: string;
}

export function StatusCell({
  confirmed,
  timestamp,
  failed = false,
  isFailedIcon = false,
  locale,
}: StatusCellProps) {
  const showTime = !failed && timestamp !== null && timestamp !== '';
  const showIcon = failed ? isFailedIcon : true;

  return (
    <div className={cls('emergency-status__cell')}>
      <p className={cls('emergency-status__cell-icon')}>
        {showIcon ? <StatusIcon confirmed={confirmed} failed={failed} /> : null}
      </p>
      {showTime ? (
        <p className={cls('emergency-status__cell-time')}>
          {formatShortTime(timestamp, locale)}
        </p>
      ) : null}
    </div>
  );
}
