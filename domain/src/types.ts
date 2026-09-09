import type { ISODate } from './dates.js';

export type DayStatus = 'OFFICE' | 'ABSENT';

export interface DayRecord {
  date: ISODate;
  status: DayStatus;
}

export interface AttendanceInput {
  /** "Today" from the user's perspective — drives which week is "this week" (always excluded). */
  today: ISODate;
  /** One entry per eligible workday that has already happened (including today, if logged). */
  records: DayRecord[];
  /** Future eligible workdays the user knows they cannot attend (leave, travel, etc). */
  blockedDates: ISODate[];
  /** Holidays / non-working days, past or future — removed entirely from eligible workdays. */
  holidays: ISODate[];
  /** Weekdays considered eligible workdays. 0=Sun..6=Sat. Default Mon-Fri: [1,2,3,4,5]. */
  workDays?: number[];
  /** If set, weeks before this date are excluded from the compliance window entirely
   * (not employed yet) rather than treated as data gaps. Use for employees with <12
   * weeks of tenure -- see compliance warnings for the ramp-up caveat. */
  employmentStartDate?: ISODate;
}

export interface WeekAgg {
  weekIndex: number;
  weekKey: ISODate; // Monday
  eligibleDates: ISODate[]; // eligible workdays this week (workDays minus holidays)
  officeDates: ISODate[]; // eligible dates recorded OFFICE
  absentDates: ISODate[]; // eligible dates recorded ABSENT
  blockedDates: ISODate[]; // eligible dates marked blocked (only meaningful for future dates)
  openDates: ISODate[]; // eligible dates with no record and not blocked
  dataGapDates: ISODate[]; // past/today eligible dates with no record at all (counted as absent, but flagged)
  fixedDays: number; // officeDates.length -- days that count no matter what happens next
  cap: number; // fixedDays + openDates.length -- max this week could still reach
  isPast: boolean; // strictly before "this week" (fully closed, nothing left to plan)
  isCurrent: boolean; // "this week" -- excluded from compliance window, but still plannable
}

export interface ComplianceWindow {
  /** The 12 weeks evaluated: weeks [currentWeekIndex-12 .. currentWeekIndex-1]. */
  weeks: { weekKey: ISODate; days: number }[];
  top8: { weekKey: ISODate; days: number }[];
  bottom4Dropped: { weekKey: ISODate; days: number }[];
  top8Sum: number;
  required: number;
  compliant: boolean;
  margin: number; // top8Sum - required; negative = deficit
  weeksConsidered: number; // <12 only during the first 12 weeks of using the tool
  warnings: string[];
}

export interface SuggestionResult {
  /** Additional office days to add, per date, to satisfy every window in the planning horizon. */
  suggestedDates: ISODate[];
  /** Per-week breakdown of the plan actually used for verification. */
  weeklyPlan: { weekKey: ISODate; fixedDays: number; addedDays: number; totalDays: number }[];
  /** true if a feasible plan was found within the horizon given caps/blocked dates. */
  feasible: boolean;
  /** Any window that remains non-compliant even after using every available open date. */
  unresolvedWindows: ISODate[];
  totalAddedDays: number;
  warnings: string[];
}
