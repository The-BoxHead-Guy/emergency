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

/**
 * Formats a timestamp as `dd/mm/yyyy hh:mm` in local time, using 24-hour time
 * and zero-padded parts. Missing or invalid input collapses to an empty string.
 */
export function formatDateTime(
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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const day = parts.find((part) => part.type === 'day')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const year = parts.find((part) => part.type === 'year')?.value;
  const hour = parts.find((part) => part.type === 'hour')?.value;
  const minute = parts.find((part) => part.type === 'minute')?.value;

  if (!day || !month || !year || !hour || !minute) {
    return '';
  }

  return `${day}/${month}/${year} ${hour}:${minute}`;
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
