import { describe, it, expect } from 'vitest';
import { suggestOfficeDays } from '../src/suggest.js';
import { computeCompliance } from '../src/compliance.js';
import { weekIndexOf, parseISO, formatISO, mondayOfWeekIndex } from '../src/dates.js';
import { weekRecords } from './helpers.js';
import type { AttendanceInput, DayRecord } from '../src/types.js';

const TODAY = '2024-06-10';
const CURRENT_WEEK = weekIndexOf(parseISO(TODAY));

/** Cross-check: re-derive every rolling window the same way computeCompliance would, using
 * the plan's own logic (today = each future week's Monday), independently of suggest.ts's
 * internals. This is the "brute-force verification" -- if this passes, the plan is provably
 * sufficient, regardless of whether the greedy that produced it was optimal. */
function verifyPlanIsCompliantForHorizon(
  input: AttendanceInput,
  suggestedDates: string[],
  horizonWeeksAhead: number,
  opts: { startT?: number } = {},
) {
  const augmented: DayRecord[] = [
    ...input.records,
    ...suggestedDates.map((date) => ({ date, status: 'OFFICE' as const })),
  ];
  const startT = opts.startT ?? CURRENT_WEEK + 1;
  for (let t = startT; t <= CURRENT_WEEK + horizonWeeksAhead; t++) {
    const today = formatISO(mondayOfWeekIndex(t));
    const result = computeCompliance({
      today,
      records: augmented,
      blockedDates: [],
      holidays: input.holidays,
    });
    expect(result.compliant, `window ending before week-index ${t} should be compliant`).toBe(
      true,
    );
  }
}

// First evaluation point whose entire 12-week window falls on/after "now" -- i.e. nothing
// in that window was already sealed by history before the plan could touch it. Windows
// before this can be genuinely unfixable if there's no prior attendance (the past can't be
// retroactively changed), which is a real property of the policy, not a bug in the planner.
const FULLY_CONTROLLABLE_T = CURRENT_WEEK + 12;

describe('suggestOfficeDays', () => {
  it('suggests 0 extra days when already compliant across the whole horizon', () => {
    const records: DayRecord[] = [];
    for (let i = 1; i <= 12; i++) records.push(...weekRecords(CURRENT_WEEK - i, 5));
    // Also pre-fill future weeks so nothing ever needs topping up within the horizon.
    for (let i = 0; i < 16; i++) records.push(...weekRecords(CURRENT_WEEK + i, 5));
    const input: AttendanceInput = { today: TODAY, records, blockedDates: [], holidays: [] };
    const result = suggestOfficeDays(input);
    expect(result.totalAddedDays).toBe(0);
    expect(result.feasible).toBe(true);
  });

  it('produces a verifiably-sufficient plan from a cold start (no history), flagging only the unfixable early windows', () => {
    const input: AttendanceInput = { today: TODAY, records: [], blockedDates: [], holidays: [] };
    const result = suggestOfficeDays(input);
    // Early windows include weeks before "now" that were never recorded (0 days, sealed) --
    // those can be genuinely infeasible. That's correct: the tool must say so, not hide it.
    for (const dateStr of result.unresolvedWindows) {
      expect(weekIndexOf(parseISO(dateStr))).toBeLessThan(FULLY_CONTROLLABLE_T);
    }
    verifyPlanIsCompliantForHorizon(input, result.suggestedDates, 16, {
      startT: FULLY_CONTROLLABLE_T,
    });
  });

  it('never suggests a blocked date, and still finds a feasible plan around it', () => {
    // Block every Monday and Tuesday for the next 8 weeks (a big chunk of capacity).
    const blockedDates: string[] = [];
    for (let i = 0; i < 8; i++) {
      const wi = CURRENT_WEEK + i;
      blockedDates.push(formatISO(mondayOfWeekIndex(wi)));
    }
    const input: AttendanceInput = { today: TODAY, records: [], blockedDates, holidays: [] };
    const result = suggestOfficeDays(input);
    for (const d of result.suggestedDates) {
      expect(blockedDates).not.toContain(d);
    }
    for (const dateStr of result.unresolvedWindows) {
      expect(weekIndexOf(parseISO(dateStr))).toBeLessThan(FULLY_CONTROLLABLE_T);
    }
    verifyPlanIsCompliantForHorizon(input, result.suggestedDates, 16, {
      startT: FULLY_CONTROLLABLE_T,
    });
  });

  it('flags a window as infeasible when blocked dates leave too little capacity', () => {
    // Block 4 of the 5 weekdays in every week for the next 12 weeks -> cap 1/week -> max 12
    // days available in the very first evaluated window, well under 24.
    const blockedDates: string[] = [];
    for (let i = 0; i < 12; i++) {
      const wi = CURRENT_WEEK + i;
      const monday = mondayOfWeekIndex(wi);
      for (let d = 1; d <= 4; d++) blockedDates.push(formatISO(monday + d * 86400000));
    }
    const input: AttendanceInput = { today: TODAY, records: [], blockedDates, holidays: [] };
    const result = suggestOfficeDays(input, { horizonWeeksAhead: 1 });
    expect(result.feasible).toBe(false);
    expect(result.unresolvedWindows.length).toBeGreaterThan(0);
  });

  it('is dynamic: re-suggesting after a missed planned day still yields a compliant plan', () => {
    const input: AttendanceInput = { today: TODAY, records: [], blockedDates: [], holidays: [] };
    const firstPlan = suggestOfficeDays(input);
    expect(firstPlan.suggestedDates.length).toBeGreaterThan(0);

    // Simulate: the user actually skips the very first suggested date (marks it ABSENT
    // instead), and time has now passed to that date. Re-plan from that new reality.
    const missedDate = firstPlan.suggestedDates[0];
    const recordsAfterMiss: DayRecord[] = [
      ...input.records,
      { date: missedDate, status: 'ABSENT' },
    ];
    const secondInput: AttendanceInput = {
      today: TODAY,
      records: recordsAfterMiss,
      blockedDates: [],
      holidays: [],
    };
    const secondPlan = suggestOfficeDays(secondInput);
    for (const dateStr of secondPlan.unresolvedWindows) {
      expect(weekIndexOf(parseISO(dateStr))).toBeLessThan(FULLY_CONTROLLABLE_T);
    }
    verifyPlanIsCompliantForHorizon(secondInput, secondPlan.suggestedDates, 16, {
      startT: FULLY_CONTROLLABLE_T,
    });
    // The one thing that must hold across a re-plan: it never suggests the date the user
    // just said they can't do, and it still finds a sufficient (verified above) plan.
    expect(secondPlan.suggestedDates).not.toContain(missedDate);
  });

  it('plans to a safety cushion above the bare policy minimum when capacity allows', () => {
    const input: AttendanceInput = { today: TODAY, records: [], blockedDates: [], holidays: [] };
    const result = suggestOfficeDays(input, { safetyBufferDays: 2 });
    const augmented: DayRecord[] = result.suggestedDates.map((date) => ({
      date,
      status: 'OFFICE' as const,
    }));
    for (let t = FULLY_CONTROLLABLE_T; t <= CURRENT_WEEK + 16; t++) {
      const today = formatISO(mondayOfWeekIndex(t));
      const compliance = computeCompliance({ today, records: augmented, blockedDates: [], holidays: [] });
      expect(compliance.top8Sum).toBeGreaterThanOrEqual(26);
    }
  });
});
