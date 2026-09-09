import type { SuggestionResult } from '@eg-attendance/domain';
import { formatShort, weekdayShort, todayLocalISO } from '@/lib/dates';

export function SuggestionCard({
  suggestion,
  onMarkDone,
  onCantMake,
  busy,
}: {
  suggestion: SuggestionResult;
  onMarkDone: (date: string) => void;
  onCantMake: (date: string) => void;
  busy: boolean;
}) {
  const today = todayLocalISO();
  const upcoming = suggestion.suggestedDates.filter((d) => d >= today).slice(0, 20);

  return (
    <section className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Suggested office days
        </h2>
        <span
          className={`rounded px-2 py-0.5 text-xs font-semibold ${
            suggestion.feasible ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {suggestion.totalAddedDays} planned
        </span>
      </div>

      {upcoming.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">
          Nothing more needed for now -- you&apos;re already on track.
        </p>
      ) : (
        <ul className="mt-3 space-y-1">
          {upcoming.map((date) => (
            <li
              key={date}
              className="flex items-center justify-between rounded border border-neutral-100 px-2 py-1.5 text-sm"
            >
              <span>
                <span className="font-medium">{weekdayShort(date)}</span>{' '}
                <span className="text-neutral-500">{formatShort(date)}</span>
              </span>
              <span className="flex gap-2">
                <button
                  disabled={busy}
                  onClick={() => onMarkDone(date)}
                  className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                >
                  Went in
                </button>
                <button
                  disabled={busy}
                  onClick={() => onCantMake(date)}
                  className="rounded bg-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 disabled:opacity-50"
                >
                  Can&apos;t make it
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {suggestion.unresolvedWindows.length > 0 && (
        <p className="mt-3 text-xs text-red-700">
          ⚠ {suggestion.unresolvedWindows.length} upcoming evaluation week(s) can&apos;t reach the
          required days no matter what you do from here (weeks starting{' '}
          {suggestion.unresolvedWindows.map((w) => formatShort(w)).join(', ')}). Check with HR --
          this may need a documented exception.
        </p>
      )}
      {suggestion.warnings.map((w, i) => (
        <p key={i} className="mt-2 text-xs text-amber-700">
          ⚠ {w}
        </p>
      ))}
    </section>
  );
}
