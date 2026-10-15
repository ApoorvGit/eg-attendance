import { describe, it, expect } from 'vitest';
import { computeCompliance } from '../src/compliance.js';
import { suggestOfficeDays } from '../src/suggest.js';
import type { AttendanceInput, DayRecord } from '../src/types.js';

// Mirrors the real discrepancy found against the company portal: today 2026-10-15 (Thu).
// Sunday–Saturday window of the 12 completed weeks is 2026-07-19 .. 2026-10-10.
const TODAY = '2026-10-15';
const base = (over: Partial<AttendanceInput>): AttendanceInput => ({
  today: TODAY,
  records: [],
  blockedDates: [],
  holidays: [],
  ...over,
});

describe('week start boundary', () => {
  it('places a Sunday office day in the Sunday–Saturday window, but not the Monday–Sunday one', () => {
    // 2026-07-19 is a Sunday -- the first day of the portal's oldest in-window week.
    const records: DayRecord[] = [{ date: '2026-07-19', status: 'OFFICE' }];

    const sun = computeCompliance(base({ records, weekStartsOn: 0 }));
    const mon = computeCompliance(base({ records, weekStartsOn: 1 }));

    // Sunday weeks: 07-19 opens week -12 (07-19..07-25), inside the 12-week window -> counts.
    expect(sun.top8Sum).toBe(1);
    // Monday weeks: 07-19 belongs to 07-13..07-19 (week -13), outside the window -> absent.
    expect(mon.top8Sum).toBe(0);
  });
});

describe('any-day office counting', () => {
  it('counts a Saturday office day -- any presence counts, not only workdays', () => {
    // 2026-10-10 is a Saturday inside the Sunday–Saturday window (week -1: 10-04..10-10).
    const records: DayRecord[] = [{ date: '2026-10-10', status: 'OFFICE' }];
    const c = computeCompliance(base({ records, weekStartsOn: 0 }));
    expect(c.top8Sum).toBe(1); // old workday-only counting dropped this and returned 0
  });

  it('still only suggests configured workdays, even with a Sunday week start', () => {
    const result = suggestOfficeDays(base({ weekStartsOn: 0, workDays: [1, 2, 3, 4, 5] }));
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const d of result.suggestedDates) {
      const [y, m, day] = d.split('-').map(Number);
      const wd = days[new Date(Date.UTC(y, m - 1, day)).getUTCDay()];
      expect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).toContain(wd);
    }
  });
});
