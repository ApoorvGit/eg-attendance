export type ISODate = string;

const EPOCH = Date.UTC(1970, 0, 1); // 1970-01-01 (a Thursday)
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

/**
 * Start-of-week (00:00 UTC) of the week containing `ms`, for a week that begins on
 * `weekStartsOn` (0=Sun .. 6=Sat). Default 1 (Monday). The company policy evaluates
 * Sunday–Saturday weeks, so the app passes 0; the Monday default only keeps older
 * callers and tests that predate the setting working unchanged.
 */
export function startOfWeek(ms: number, weekStartsOn = 1): number {
  const offset = (weekdayOf(ms) - weekStartsOn + 7) % 7;
  return addDays(ms, -offset);
}

export function weekKeyOf(ms: number, weekStartsOn = 1): ISODate {
  return formatISO(startOfWeek(ms, weekStartsOn));
}

/** Sequential index of the week containing `ms`, increasing with time. Only ever used for
 * relative arithmetic, so the absolute origin is irrelevant as long as it is consistent. */
export function weekIndexOf(ms: number, weekStartsOn = 1): number {
  return Math.round((startOfWeek(ms, weekStartsOn) - startOfWeek(EPOCH, weekStartsOn)) / (7 * DAY_MS));
}

export function startOfWeekIndex(weekIndex: number, weekStartsOn = 1): number {
  return startOfWeek(EPOCH, weekStartsOn) + weekIndex * 7 * DAY_MS;
}

export function datesInWeek(weekIndex: number, weekStartsOn = 1): ISODate[] {
  const start = startOfWeekIndex(weekIndex, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => formatISO(addDays(start, i)));
}

export function isSameOrBefore(a: ISODate, b: ISODate): boolean {
  return parseISO(a) <= parseISO(b);
}
