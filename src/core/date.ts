/**
 * Formats a timestamp as `h:mmam` or `h:mmpm` in local time, without a space
 * or leading zero.
 */
export function formatShortTime(
  value: string | number | Date | null,
  locale = 'es',
): string {
  if (value === null) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const parts = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === 'hour')?.value;
  const minute = parts.find((part) => part.type === 'minute')?.value;
  const dayPeriod = parts.find((part) => part.type === 'dayPeriod')?.value;

  if (!hour || !minute) {
    return '';
  }

  return `${hour}:${minute}${normalizePeriod(dayPeriod)}`;
}

function normalizePeriod(dayPeriod: string | undefined): string {
  if (!dayPeriod) {
    return '';
  }

  if (/^p/i.test(dayPeriod)) {
    return 'pm';
  }

  return /^a/i.test(dayPeriod) ? 'am' : '';
}
