import { addDaysISO, startOfWeekISO } from './dates';

/**
 * A day is in exactly one of these states. The whole UI -- colour, label, icon,
 * and what a tap does -- derives from this single value, so there is one mental
 * model instead of three separate screens for "did I go" / "should I go" / "can I go".
 */
export type DayKind =
  | 'office' // logged: you were in the office
  | 'absent' // logged: you were not
  | 'unlogged' // a past workday with no record yet -- needs your input
  | 'suggested' // upcoming: the planner says go in on this day
  | 'blocked' // upcoming: you told us you can't go in
  | 'free'; // upcoming: nothing required, nothing blocked

export interface DayCell {
  date: string;
  kind: DayKind;
  isToday: boolean;
  /** true for today and earlier -- these get logged; later days get blocked/unblocked. */
  isLoggable: boolean;
}

export interface WeekView {
  startISO: string; // first day of the week (depends on weekStartsOn)
  label: string;
  days: DayCell[];
  /** upcoming office days still required this week */
  goInCount: number;
  /** office days already logged this week */
  officeCount: number;
  isCurrent: boolean;
  isPast: boolean;
}

export interface DayContext {
  today: string;
  attendance: Map<string, 'OFFICE' | 'ABSENT'>;
  blocked: Set<string>;
  suggested: Set<string>;
  holidays: Set<string>;
  /** 0=Sun..6=Sat */
  workDays: number[];
  /** day each week begins, 0=Sun..6=Sat */
  weekStartsOn: number;
}

function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function dayKind(date: string, ctx: DayContext): DayKind {
  const logged = ctx.attendance.get(date);
  if (logged === 'OFFICE') return 'office';
  if (logged === 'ABSENT') return 'absent';

  if (date <= ctx.today) return 'unlogged';
  if (ctx.blocked.has(date)) return 'blocked';
  if (ctx.suggested.has(date)) return 'suggested';
  return 'free';
}

export function buildWeek(startISO: string, ctx: DayContext): WeekView {
  const workDays = new Set(ctx.workDays);
  const days: DayCell[] = [];

  for (let i = 0; i < 7; i++) {
    const date = addDaysISO(startISO, i);
    const isWorkday = workDays.has(weekdayOf(date)) && !ctx.holidays.has(date);
    // Show every eligible workday, plus any other day that actually has a logged record --
    // so a weekend or holiday office day (which counts toward the policy) is still visible
    // and correctable, rather than silently missing from the strip.
    if (!isWorkday && !ctx.attendance.has(date)) continue;
    days.push({
      date,
      kind: dayKind(date, ctx),
      isToday: date === ctx.today,
      isLoggable: date <= ctx.today,
    });
  }

  const thisStart = startOfWeekISO(ctx.today, ctx.weekStartsOn);
  return {
    startISO,
    label: weekLabel(startISO, thisStart, days),
    days,
    goInCount: days.filter((d) => d.kind === 'suggested').length,
    officeCount: days.filter((d) => d.kind === 'office').length,
    isCurrent: startISO === thisStart,
    isPast: startISO < thisStart,
  };
}

function weekLabel(startISO: string, thisStartISO: string, days: DayCell[]): string {
  if (startISO === thisStartISO) return 'This week';
  if (startISO === addDaysISO(thisStartISO, 7)) return 'Next week';
  if (startISO === addDaysISO(thisStartISO, -7)) return 'Last week';
  // Range of the days actually shown (typically Mon–Fri), not the raw week bounds.
  const first = days[0]?.date ?? startISO;
  const last = days[days.length - 1]?.date ?? addDaysISO(startISO, 6);
  const [, m, d] = first.split('-').map(Number);
  const [, em, ed] = last.split('-').map(Number);
  const month = (n: number) =>
    new Date(2000, n - 1, 1).toLocaleDateString(undefined, { month: 'short' });
  return m === em ? `${month(m)} ${d}–${ed}` : `${month(m)} ${d} – ${month(em)} ${ed}`;
}

/** Human-readable state, shown under each cell so a tap's effect is never a guess. */
export const KIND_LABEL: Record<DayKind, string> = {
  office: 'went in',
  absent: 'was out',
  unlogged: 'log it',
  suggested: 'go in',
  blocked: 'out',
  free: 'free',
};
