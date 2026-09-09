import { datesInWeek, weekIndexOf, weekKeyOf, parseISO } from './dates.js';
import type { AttendanceInput, WeekAgg } from './types.js';

const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5]; // Mon-Fri

/**
 * Builds per-week aggregates for every week index in [fromWeekIndex, toWeekIndex] (inclusive),
 * regardless of whether input data covers that range -- weeks with no data are just empty/open.
 */
export function buildWeeks(
  input: AttendanceInput,
  fromWeekIndex: number,
  toWeekIndex: number,
): WeekAgg[] {
  const workDays = new Set(input.workDays ?? DEFAULT_WORK_DAYS);
  const holidays = new Set(input.holidays);
  const recordByDate = new Map(input.records.map((r) => [r.date, r.status]));
  const blocked = new Set(input.blockedDates);

  const todayMs = parseISO(input.today);
  const currentWeekIndex = weekIndexOf(todayMs);

  const weeks: WeekAgg[] = [];
  for (let wi = fromWeekIndex; wi <= toWeekIndex; wi++) {
    const allDates = datesInWeek(wi);
    const eligibleDates = allDates.filter(
      (d) => workDays.has(new Date(parseISO(d)).getUTCDay()) && !holidays.has(d),
    );

    const officeDates: string[] = [];
    const absentDates: string[] = [];
    const blockedDates: string[] = [];
    const openDates: string[] = [];
    const dataGapDates: string[] = [];

    for (const d of eligibleDates) {
      const status = recordByDate.get(d);
      const isFuture = parseISO(d) > todayMs;
      if (status === 'OFFICE') {
        officeDates.push(d);
      } else if (status === 'ABSENT') {
        absentDates.push(d);
      } else if (isFuture && blocked.has(d)) {
        blockedDates.push(d);
      } else if (isFuture) {
        openDates.push(d);
      } else {
        // past/today eligible workday with no record at all -- data gap, treated as absent
        // (0 days, the safe direction) but flagged so the caller can prompt for it.
        absentDates.push(d);
        dataGapDates.push(d);
      }
    }

    weeks.push({
      weekIndex: wi,
      weekKey: weekKeyOf(datesInWeekMs(wi)),
      eligibleDates,
      officeDates,
      absentDates,
      blockedDates,
      openDates,
      dataGapDates,
      fixedDays: officeDates.length,
      cap: officeDates.length + openDates.length,
      isPast: wi < currentWeekIndex,
      isCurrent: wi === currentWeekIndex,
    });
  }
  return weeks;
}

function datesInWeekMs(weekIndex: number): number {
  return parseISO(datesInWeek(weekIndex)[0]);
}
