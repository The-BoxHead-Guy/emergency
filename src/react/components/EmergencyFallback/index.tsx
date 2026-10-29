import { copy } from '@/core/copy';
import type { EmergencyError, EmergencyFallback } from '@/core/types';
import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';

function errorCopy(error: EmergencyError): string {
  switch (error.code) {
    case 'geolocation_denied':
      return copy.geolocationDenied;
    case 'geolocation_timeout':
      return copy.geolocationTimeout;
    case 'geolocation_unsupported':
      return copy.geolocationUnsupported;
    default:
      return copy.geolocationUnavailable;
  }
}

export function EmergencyFallback({
  fallback,
  error,
}: {
  readonly fallback: EmergencyFallback | null;
  readonly error: EmergencyError;
}) {
  return (
    <div className={cls('emergency-fallback')}>
      <h4 className={cls('emergency-fallback__title')}>{copy.fallbackTitle}</h4>
      <p className={cls('emergency-fallback__text')}>{errorCopy(error)}</p>
      {fallback ? (
        <a
          className={cls('emergency-fallback__phone')}
          href={`tel:${fallback.phone.replace(/[^\d+]/g, '')}`}
        >
          <Icon name="message" />
          {fallback.label}
        </a>
      ) : null}
    </div>
  );
}
