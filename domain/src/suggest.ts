import { weekIndexOf, parseISO, mondayOfWeekIndex, formatISO } from './dates.js';
import { buildWeeks } from './aggregate.js';
import type { AttendanceInput, SuggestionResult, WeekAgg } from './types.js';

export interface SuggestOptions {
  windowWeeks?: number; // default 12
  topK?: number; // default 8
  requiredDays?: number; // default 24 -- the actual policy threshold, never changed silently
  /** Extra days planned on top of `requiredDays`, so one missed suggested day doesn't
   * immediately create a deficit. Purely a planning cushion -- computeCompliance() still
   * reports true compliance against the real policy threshold, unaffected by this. */
  safetyBufferDays?: number; // default 2
  horizonWeeksAhead?: number; // default 16 -- how many future evaluation points to plan for
  maxIterations?: number; // safety guard, default 5000
}

interface Window {
  t: number; // the future week index at which this window gets evaluated ("this week" = t)
  weekIndices: number[]; // the windowWeeks weeks being evaluated, i.e. [t-windowWeeks .. t-1]
}

/**
 * Plans the minimum set of additional future office days needed so that EVERY rolling window
 * that will be evaluated over the next `horizonWeeksAhead` weeks is compliant -- not just the
 * window that would be evaluated today. Recompute this from scratch any time real attendance
 * or blocked dates change; it always reflects the current actual state, never a stale plan.
 *
 * Algorithm: iterative greedy repair, verified by exact recomputation (sort + sum) at every
 * step -- never an approximation of "top 8 of 12". At each step it resolves the single
 * soonest-deadline violating window by adding one day to whichever still-open date is shared
 * by the most currently-violating windows (a coverage greedy), since near-term weeks overlap
 * more future windows than far-future ones. Monotonicity of top-8-of-12 in each week's count
 * guarantees this never regresses an already-satisfied window.
 */
export function suggestOfficeDays(
  input: AttendanceInput,
  options: SuggestOptions = {},
): SuggestionResult {
  const windowWeeks = options.windowWeeks ?? 12;
  const topK = options.topK ?? 8;
  const required = options.requiredDays ?? 24;
  const planningTarget = required + (options.safetyBufferDays ?? 2);
  const horizonWeeksAhead = options.horizonWeeksAhead ?? 16;
  const maxIterations = options.maxIterations ?? 5000;

  const currentWeekIndex = weekIndexOf(parseISO(input.today));
  const minWeekIndex = currentWeekIndex - windowWeeks + 1;
  const maxWeekIndex = currentWeekIndex + horizonWeeksAhead - 1;

  const weeks = buildWeeks(input, minWeekIndex, maxWeekIndex);
  const byIndex = new Map<number, WeekAgg>(weeks.map((w) => [w.weekIndex, w]));

  const added = new Map<number, number>(); // weekIndex -> extra days added by the planner
  for (const w of weeks) added.set(w.weekIndex, 0);

  const daysFor = (weekIndex: number): number => {
    const w = byIndex.get(weekIndex);
    if (!w) return 0;
    return w.fixedDays + (added.get(weekIndex) ?? 0);
  };
  const remainingCap = (weekIndex: number): number => {
    const w = byIndex.get(weekIndex);
    if (!w) return 0;
    return w.openDates.length - (added.get(weekIndex) ?? 0);
  };
  const top8Sum = (weekIndices: number[]): number => {
    const sorted = weekIndices.map(daysFor).sort((a, b) => b - a);
    return sorted.slice(0, Math.min(topK, sorted.length)).reduce((s, d) => s + d, 0);
  };

  const windows: Window[] = [];
  for (let t = currentWeekIndex + 1; t <= currentWeekIndex + horizonWeeksAhead; t++) {
    const weekIndices: number[] = [];
    for (let wi = t - windowWeeks; wi <= t - 1; wi++) weekIndices.push(wi);
    windows.push({ t, weekIndices });
  }

  const unresolved = new Set<number>(); // t values that can't even hit the real policy threshold
  const bufferShort = new Set<number>(); // t values that hit `required` but not the buffer target
  let iterations = 0;

  while (iterations++ < maxIterations) {
    const settled = (t: number) => unresolved.has(t) || bufferShort.has(t);
    const violating = windows
      .filter((w) => !settled(w.t))
      .filter((w) => top8Sum(w.weekIndices) < planningTarget)
      .sort((a, b) => a.t - b.t);

    if (violating.length === 0) break;

    const soonest = violating[0];
    const candidates = soonest.weekIndices.filter((wi) => remainingCap(wi) > 0);

    if (candidates.length === 0) {
      // Out of open dates for this window. Real compliance still takes priority over the buffer.
      const achieved = top8Sum(soonest.weekIndices);
      if (achieved < required) {
        unresolved.add(soonest.t);
      } else {
        bufferShort.add(soonest.t);
      }
      continue;
    }

    let best = candidates[0];
    let bestScore = -1;
    for (const wi of candidates) {
      const score = violating.filter((v) => v.weekIndices.includes(wi)).length;
      if (score > bestScore || (score === bestScore && wi < best)) {
        best = wi;
        bestScore = score;
      }
    }

    added.set(best, (added.get(best) ?? 0) + 1);
  }

  const suggestedDates: string[] = [];
  const weeklyPlan: SuggestionResult['weeklyPlan'] = [];
  for (const w of weeks) {
    if (w.isPast) continue;
    const addedCount = added.get(w.weekIndex) ?? 0;
    if (addedCount > 0) {
      suggestedDates.push(...w.openDates.slice(0, addedCount));
    }
    weeklyPlan.push({
      weekKey: w.weekKey,
      fixedDays: w.fixedDays,
      addedDays: addedCount,
      totalDays: w.fixedDays + addedCount,
    });
  }
  suggestedDates.sort();

  const warnings: string[] = [];
  if (unresolved.size > 0) {
    warnings.push(
      `${unresolved.size} future evaluation week(s) cannot reach ${required} days even using every remaining open date -- likely too many blocked/holiday days in their window, or gaps in earlier history that can't be changed retroactively.`,
    );
  }
  if (bufferShort.size > 0) {
    warnings.push(
      `${bufferShort.size} week(s) hit the real ${required}-day requirement but not the ${planningTarget}-day safety cushion -- you have zero slack for a missed day in those windows.`,
    );
  }

  return {
    suggestedDates,
    weeklyPlan,
    feasible: unresolved.size === 0,
    unresolvedWindows: [...unresolved]
      .sort((a, b) => a - b)
      .map((t) => formatISO(mondayOfWeekIndex(t))),
    totalAddedDays: suggestedDates.length,
    warnings,
  };
}
