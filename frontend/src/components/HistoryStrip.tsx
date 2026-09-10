import type { ComplianceWindow } from '@eg-attendance/domain';
import { formatShort } from '@/lib/dates';

/** The policy mechanics, on demand: which of the last 12 weeks are being counted. */
export function HistoryStrip({ compliance }: { compliance: ComplianceWindow }) {
  const counted = new Set(compliance.top8.map((w) => w.weekKey));
  const max = Math.max(5, ...compliance.weeks.map((w) => w.days));

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Your policy counts the <strong className="font-medium text-foreground">best 8</strong> of
        the last 12 completed weeks. This week is always excluded.
      </p>

      <div className="flex items-end gap-1">
        {compliance.weeks.map((w) => {
          const isCounted = counted.has(w.weekKey);
          return (
            <div key={w.weekKey} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] tabular-nums text-muted-foreground">{w.days}</span>
              <div
                title={`Week of ${formatShort(w.weekKey)}: ${w.days} day${w.days === 1 ? '' : 's'}${
                  isCounted ? ' (counted)' : ' (dropped)'
                }`}
                style={{ height: `${Math.max(4, (w.days / max) * 44)}px` }}
                className={`w-full rounded-sm ${
                  isCounted ? 'bg-foreground' : 'bg-muted ring-1 ring-inset ring-border'
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-foreground" aria-hidden />
          counted ({compliance.top8Sum} days)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-muted ring-1 ring-inset ring-border" aria-hidden />
          dropped
        </span>
      </div>

      {compliance.warnings.length > 0 && (
        <ul className="mt-4 space-y-2">
          {compliance.warnings.map((w, i) => (
            <li key={i} className="text-xs text-warn">
              {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
