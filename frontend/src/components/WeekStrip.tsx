'use client';

import { KIND_LABEL, type DayCell, type DayKind, type WeekView } from '@/lib/dayState';
import { weekdayShort } from '@/lib/dates';
import { BuildingIcon, CheckIcon, XIcon } from './Icons';

/** Per-state styling. "suggested" intentionally uses the highest-contrast fill on the
 * page so the eye lands on what you must actually do. State is never conveyed by
 * colour alone -- every cell also carries an icon and a word. */
const CELL_STYLE: Record<DayKind, string> = {
  suggested: 'bg-action text-action-foreground border-action font-semibold',
  office: 'bg-ok-surface text-ok border-ok-border',
  absent: 'bg-muted text-muted-foreground border-border',
  blocked: 'bg-muted text-muted-foreground border-border',
  unlogged: 'bg-warn-surface text-warn border-warn-border border-dashed',
  free: 'bg-card text-muted-foreground border-border border-dashed',
};

function CellIcon({ kind }: { kind: DayKind }) {
  if (kind === 'office') return <CheckIcon className="size-4" />;
  if (kind === 'suggested') return <BuildingIcon className="size-4" />;
  if (kind === 'blocked' || kind === 'absent') return <XIcon className="size-4" />;
  return null;
}

/** What a tap will do, spelled out for the tooltip and the screen reader. */
function actionHint(day: DayCell): string {
  if (day.isLoggable) {
    if (day.kind === 'unlogged') return 'mark as went in';
    if (day.kind === 'office') return 'change to was out';
    return 'clear this entry';
  }
  return day.kind === 'blocked' ? "mark as available again" : "mark as can't go in";
}

export function WeekStrip({
  week,
  onDayTap,
}: {
  week: WeekView;
  onDayTap: (day: DayCell) => void;
}) {
  return (
    <section className="mb-6">
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{week.label}</h2>
        <p className="text-xs text-muted-foreground">
          {week.goInCount > 0 ? (
            <>
              go in{' '}
              <span className="font-semibold text-foreground">
                {week.goInCount} {week.goInCount === 1 ? 'day' : 'days'}
              </span>
            </>
          ) : week.officeCount > 0 ? (
            <>{week.officeCount} in the office</>
          ) : (
            <>nothing needed</>
          )}
        </p>
      </header>

      <div className="grid grid-cols-5 gap-1.5">
        {week.days.map((day) => {
          const dayNum = Number(day.date.slice(8, 10));
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onDayTap(day)}
              title={`${weekdayShort(day.date)} ${dayNum} — ${KIND_LABEL[day.kind]}. Tap to ${actionHint(day)}.`}
              aria-label={`${weekdayShort(day.date)} ${dayNum}, currently ${KIND_LABEL[day.kind]}. Tap to ${actionHint(day)}.`}
              className={`flex min-h-[68px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border transition-colors duration-200 hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:hover:brightness-125 ${
                CELL_STYLE[day.kind]
              } ${day.isToday ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''}`}
            >
              <span className="text-[10px] uppercase tracking-wide opacity-70">
                {weekdayShort(day.date).slice(0, 3)}
              </span>
              <span className="text-base leading-none tabular-nums">{dayNum}</span>
              <span className="flex h-4 items-center gap-1 text-[10px]">
                <CellIcon kind={day.kind} />
                {KIND_LABEL[day.kind]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
