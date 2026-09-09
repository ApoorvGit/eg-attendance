import { weekIndexOf, parseISO } from './dates.js';
import { buildWeeks } from './aggregate.js';
import type { AttendanceInput, ComplianceWindow } from './types.js';

export interface ComplianceOptions {
  windowWeeks?: number; // default 12
  topK?: number; // default 8
  requiredDays?: number; // default 24
}

/**
 * Evaluates the rolling-window policy as of `input.today`, using only weeks strictly
 * before "this week" (this week is always excluded, per policy).
 */
export function computeCompliance(
  input: AttendanceInput,
  options: ComplianceOptions = {},
): ComplianceWindow {
  const windowWeeks = options.windowWeeks ?? 12;
  const topK = options.topK ?? 8;
  const required = options.requiredDays ?? 24;

  const currentWeekIndex = weekIndexOf(parseISO(input.today));
  const windowEnd = currentWeekIndex - 1;
  const windowStart = windowEnd - windowWeeks + 1;

  const allWeeks = buildWeeks(input, windowStart, windowEnd);
  const employmentStartWeekIndex = input.employmentStartDate
    ? weekIndexOf(parseISO(input.employmentStartDate))
    : -Infinity;
  const weeks = allWeeks.filter((w) => w.weekIndex >= employmentStartWeekIndex);

  const withCounts = weeks.map((w) => ({ weekKey: w.weekKey, days: w.fixedDays }));
  const sortedDesc = [...withCounts].sort((a, b) => b.days - a.days);
  const effectiveTopK = Math.min(topK, sortedDesc.length);

  const top8 = sortedDesc.slice(0, effectiveTopK);
  const bottom4Dropped = sortedDesc.slice(effectiveTopK);
  const top8Sum = top8.reduce((s, w) => s + w.days, 0);

  const warnings: string[] = [];
  const gapWeeks = weeks.filter((w) => w.dataGapDates.length > 0);
  if (gapWeeks.length > 0) {
    const totalGapDays = gapWeeks.reduce((s, w) => s + w.dataGapDates.length, 0);
    warnings.push(
      `${totalGapDays} past workday(s) across ${gapWeeks.length} week(s) in this window have no logged attendance and are being counted as absent (0 days) by default. Log them for an accurate number.`,
    );
  }
  if (weeks.length < windowWeeks) {
    warnings.push(
      `Only ${weeks.length} week(s) of history exist before this week (policy expects ${windowWeeks}). Using best ${effectiveTopK} of ${weeks.length}. If you've been here less than ${windowWeeks} weeks, confirm with HR how ramp-up is evaluated -- this is an assumption, not a confirmed rule.`,
    );
  }

  return {
    weeks: withCounts,
    top8,
    bottom4Dropped,
    top8Sum,
    required,
    compliant: top8Sum >= required,
    margin: top8Sum - required,
    weeksConsidered: weeks.length,
    warnings,
  };
}
