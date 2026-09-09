export type ISODate = string;

const EPOCH_MONDAY = Date.UTC(1970, 0, 5); // 1970-01-05 is a Monday
const DAY_MS = 24 * 60 * 60 * 1000;

export function parseISO(date: ISODate): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function formatISO(ms: number): ISODate {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(ms: number, n: number): number {
  return ms + n * DAY_MS;
}

/** 0=Sunday .. 6=Saturday, matching Date#getUTCDay() */
export function weekdayOf(ms: number): number {
  return new Date(ms).getUTCDay();
}

/** Monday (00:00 UTC) of the ISO week containing `ms`. */
export function mondayOf(ms: number): number {
  const dow = weekdayOf(ms); // 0..6, Sun=0
  const offsetFromMonday = (dow + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  return addDays(ms, -offsetFromMonday);
}

export function weekKeyOf(ms: number): ISODate {
  return formatISO(mondayOf(ms));
}

/** Sequential index of the ISO week containing `ms`, monotonically increasing with time. */
export function weekIndexOf(ms: number): number {
  return Math.round((mondayOf(ms) - EPOCH_MONDAY) / (7 * DAY_MS));
}

export function mondayOfWeekIndex(weekIndex: number): number {
  return EPOCH_MONDAY + weekIndex * 7 * DAY_MS;
}

export function datesInWeek(weekIndex: number): ISODate[] {
  const monday = mondayOfWeekIndex(weekIndex);
  return Array.from({ length: 7 }, (_, i) => formatISO(addDays(monday, i)));
}

export function isSameOrBefore(a: ISODate, b: ISODate): boolean {
  return parseISO(a) <= parseISO(b);
}
