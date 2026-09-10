import { addDaysISO, mondayOfISO } from './dates';

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
  mondayISO: string;
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

export function buildWeek(mondayISO: string, ctx: DayContext): WeekView {
  const workDays = new Set(ctx.workDays);
  const days: DayCell[] = [];

  for (let i = 0; i < 7; i++) {
    const date = addDaysISO(mondayISO, i);
    if (!workDays.has(weekdayOf(date))) continue;
    if (ctx.holidays.has(date)) continue; // holidays aren't eligible, so they aren't shown
    days.push({
      date,
      kind: dayKind(date, ctx),
      isToday: date === ctx.today,
      isLoggable: date <= ctx.today,
    });
  }

  const thisMonday = mondayOfISO(ctx.today);
  return {
    mondayISO,
    label: weekLabel(mondayISO, thisMonday),
    days,
    goInCount: days.filter((d) => d.kind === 'suggested').length,
    officeCount: days.filter((d) => d.kind === 'office').length,
    isCurrent: mondayISO === thisMonday,
    isPast: mondayISO < thisMonday,
  };
}

function weekLabel(mondayISO: string, thisMondayISO: string): string {
  if (mondayISO === thisMondayISO) return 'This week';
  if (mondayISO === addDaysISO(thisMondayISO, 7)) return 'Next week';
  if (mondayISO === addDaysISO(thisMondayISO, -7)) return 'Last week';
  const [, m, d] = mondayISO.split('-').map(Number);
  const end = addDaysISO(mondayISO, 4);
  const [, em, ed] = end.split('-').map(Number);
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
