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

/** Interface standard timezone for every displayed timestamp. */
const INTERFACE_TIME_ZONE = 'America/Caracas';

/**
 * Formats a timestamp as `dd/mm/yyyy hh:mm AM` in Venezuela local time
 * (`America/Caracas`), using a zero-padded 12-hour clock. Missing or invalid
 * input collapses to an empty string.
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
    timeZone: INTERFACE_TIME_ZONE,
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

  const hour24 = Number(hour);

  if (!Number.isInteger(hour24)) {
    return '';
  }

  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const period = hour24 < 12 ? 'AM' : 'PM';

  return `${day}/${month}/${year} ${String(hour12).padStart(2, '0')}:${minute} ${period}`;
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
