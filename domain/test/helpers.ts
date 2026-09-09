import { mondayOfWeekIndex, formatISO, addDays } from '../src/dates.js';
import type { DayRecord } from '../src/types.js';

/** The `weekdays` first weekdays (Mon, Tue, ...) of week `weekIndex` become OFFICE,
 * the rest of the week's Mon-Fri become ABSENT (so the week is always fully "recorded"). */
export function weekRecords(weekIndex: number, officeDays: number): DayRecord[] {
  const monday = mondayOfWeekIndex(weekIndex);
  const records: DayRecord[] = [];
  for (let i = 0; i < 5; i++) {
    const date = formatISO(addDays(monday, i));
    records.push({ date, status: i < officeDays ? 'OFFICE' : 'ABSENT' });
  }
  return records;
}

export function weekdayDate(weekIndex: number, dayOffset: number): string {
  return formatISO(addDays(mondayOfWeekIndex(weekIndex), dayOffset));
}
