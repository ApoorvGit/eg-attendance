import { describe, it, expect } from 'vitest';
import { computeCompliance } from '../src/compliance.js';
import { weekIndexOf, parseISO, formatISO, mondayOfWeekIndex } from '../src/dates.js';
import { weekRecords, weekdayDate } from './helpers.js';
import type { DayRecord } from '../src/types.js';

const TODAY = '2024-06-10'; // arbitrary anchor, a Monday
const CURRENT_WEEK = weekIndexOf(parseISO(TODAY));

describe('computeCompliance', () => {
  it('is exactly compliant at the boundary: 8 weeks x 3 days = 24', () => {
    const records: DayRecord[] = [];
    for (let i = 1; i <= 12; i++) {
      const wi = CURRENT_WEEK - i;
      const days = i <= 8 ? 3 : 0; // 8 weeks of 3 days, 4 weeks of 0 days
      records.push(...weekRecords(wi, days));
    }
    const result = computeCompliance({ today: TODAY, records, blockedDates: [], holidays: [] });
    expect(result.top8Sum).toBe(24);
    expect(result.compliant).toBe(true);
    expect(result.margin).toBe(0);
    expect(result.weeksConsidered).toBe(12);
  });

  it('flags non-compliance one day under the boundary', () => {
    const records: DayRecord[] = [];
    for (let i = 1; i <= 12; i++) {
      const wi = CURRENT_WEEK - i;
      const days = i === 1 ? 2 : i <= 8 ? 3 : 0; // one of the top weeks short by 1
      records.push(...weekRecords(wi, days));
    }
    const result = computeCompliance({ today: TODAY, records, blockedDates: [], holidays: [] });
    expect(result.top8Sum).toBe(23);
    expect(result.compliant).toBe(false);
    expect(result.margin).toBe(-1);
  });

  it('drops the 4 weakest weeks out of 12, regardless of their position in time', () => {
    const records: DayRecord[] = [];
    const strong = [1, 2, 3, 4, 5, 6, 7, 8]; // weeks-ago with 5 days
    for (let i = 1; i <= 12; i++) {
      const wi = CURRENT_WEEK - i;
      records.push(...weekRecords(wi, strong.includes(i) ? 5 : 0));
    }
    const result = computeCompliance({ today: TODAY, records, blockedDates: [], holidays: [] });
    expect(result.top8Sum).toBe(40);
    expect(result.bottom4Dropped).toHaveLength(4);
    expect(result.bottom4Dropped.every((w) => w.days === 0)).toBe(true);
    expect(result.compliant).toBe(true);
  });

  it('this week and future weeks never enter the window', () => {
    const records: DayRecord[] = [];
    for (let i = 1; i <= 12; i++) {
      records.push(...weekRecords(CURRENT_WEEK - i, 3)); // 12 x 3 = well above 24 in top8
    }
    // Log 5 office days *this week* (should be excluded) and would-be-future days.
    records.push(...weekRecords(CURRENT_WEEK, 5));
    const result = computeCompliance({ today: TODAY, records, blockedDates: [], holidays: [] });
    expect(result.weeks.some((w) => w.weekKey === formatISO(mondayOfWeekIndex(CURRENT_WEEK)))).toBe(
      false,
    );
  });

  it('treats a holiday as not eligible, not as an absence', () => {
    const wi = CURRENT_WEEK - 1;
    const holiday = weekdayDate(wi, 0); // Monday of that week
    const records: DayRecord[] = weekRecords(wi, 0).filter((r) => r.date !== holiday);
    // Remaining 4 weekdays (Tue-Fri) all logged OFFICE.
    for (const r of records) r.status = 'OFFICE';
    for (let i = 2; i <= 12; i++) records.push(...weekRecords(CURRENT_WEEK - i, 3));
    const result = computeCompliance({
      today: TODAY,
      records,
      blockedDates: [],
      holidays: [holiday],
    });
    expect(result.weeksConsidered).toBe(12);
    // week -1 should show 4 days (holiday excluded, not counted as absent-but-still-eligible)
    const targetWeekKey = formatISO(mondayOfWeekIndex(wi));
    expect(result.weeks.find((w) => w.weekKey === targetWeekKey)?.days).toBe(4);
  });

  it('flags unlogged past workdays as a data gap warning, counting them as absent', () => {
    const records: DayRecord[] = [];
    for (let i = 1; i <= 12; i++) {
      records.push(...weekRecords(CURRENT_WEEK - i, i === 1 ? 2 : 3)); // week -1 only has 2 logged
    }
    // Simulate a gap: drop one record from week -1 entirely (neither OFFICE nor ABSENT).
    const wk1Date = weekdayDate(CURRENT_WEEK - 1, 4);
    const withGap = records.filter((r) => r.date !== wk1Date);
    const result = computeCompliance({
      today: TODAY,
      records: withGap,
      blockedDates: [],
      holidays: [],
    });
    expect(result.warnings.some((w) => w.includes('no logged attendance'))).toBe(true);
  });

  it('excludes pre-employment weeks and warns when tenure is under 12 weeks', () => {
    const employmentStartWeek = CURRENT_WEEK - 5;
    const records: DayRecord[] = [];
    for (let i = 1; i <= 5; i++) {
      records.push(...weekRecords(CURRENT_WEEK - i, 3));
    }
    const result = computeCompliance({
      today: TODAY,
      records,
      blockedDates: [],
      holidays: [],
      employmentStartDate: formatISO(mondayOfWeekIndex(employmentStartWeek)),
    });
    expect(result.weeksConsidered).toBe(5);
    expect(result.warnings.some((w) => w.includes('less than'))).toBe(true);
  });
});
