import type { ComplianceWindow } from '@eg-attendance/domain';
import { formatShort } from '@/lib/dates';

export function ComplianceCard({ compliance }: { compliance: ComplianceWindow }) {
  const top8Keys = new Set(compliance.top8.map((w) => w.weekKey));

  return (
    <section className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Compliance status
        </h2>
        <span
          className={`rounded px-2 py-0.5 text-xs font-semibold ${
            compliance.compliant
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {compliance.compliant ? 'Compliant' : 'Non-compliant'}
        </span>
      </div>

      <p className="mt-2 text-2xl font-bold">
        {compliance.top8Sum} / {compliance.required} days
        <span className="ml-2 text-sm font-normal text-neutral-500">
          ({compliance.margin >= 0 ? '+' : ''}
          {compliance.margin} margin)
        </span>
      </p>

      <div className="mt-3 grid grid-cols-6 gap-1 sm:grid-cols-12">
        {compliance.weeks.map((w) => (
          <div
            key={w.weekKey}
            title={`${formatShort(w.weekKey)}: ${w.days} day(s)`}
            className={`flex h-10 flex-col items-center justify-center rounded text-[10px] font-medium ${
              top8Keys.has(w.weekKey)
                ? 'bg-neutral-800 text-white'
                : 'bg-neutral-100 text-neutral-400'
            }`}
          >
            <span>{w.days}</span>
          </div>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-neutral-400">
        Dark = counted in your best 8 weeks. Light = dropped.
      </p>

      {compliance.warnings.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-amber-700">
          {compliance.warnings.map((w, i) => (
            <li key={i}>⚠ {w}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
