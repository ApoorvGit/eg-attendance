import type { ComplianceWindow, SuggestionResult } from '@eg-attendance/domain';
import { AlertIcon, CheckIcon } from './Icons';
import { formatShort } from '@/lib/dates';

/** The headline answer. Deliberately says it in words first, numbers second --
 * the policy mechanics live behind the history disclosure. */
export function StatusHero({
  compliance,
  suggestion,
}: {
  compliance: ComplianceWindow;
  suggestion: SuggestionResult;
}) {
  const { compliant, margin, top8Sum, required } = compliance;
  const short = Math.abs(margin);

  return (
    <section className="mb-8">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
            compliant
              ? 'bg-ok-surface text-ok ring-1 ring-ok-border'
              : 'bg-danger-surface text-danger ring-1 ring-danger-border'
          }`}
        >
          {compliant ? <CheckIcon className="size-5" /> : <AlertIcon className="size-5" />}
        </span>

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {compliant ? "You're compliant" : 'Action needed'}
          </h1>
          <p className="mt-0.5 text-muted-foreground">
            {compliant ? (
              margin > 0 ? (
                <>
                  {margin} spare day{margin === 1 ? '' : 's'} — you could miss{' '}
                  {margin === 1 ? 'one day' : `${margin} days`} and still be fine.
                </>
              ) : (
                <>
                  No spare days — missing one more day would put you out of compliance. The plan
                  below builds your cushion back up.
                </>
              )
            ) : (
              <>
                You&apos;re {short} day{short === 1 ? '' : 's'} short right now. Follow the plan
                below to recover.
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/80">
            {top8Sum} of {required} days counted
          </p>
        </div>
      </div>

      {suggestion.unresolvedWindows.length > 0 && (
        <div className="mt-4 rounded-lg border border-danger-border bg-danger-surface p-3">
          <p className="flex items-start gap-2 text-sm text-danger">
            <AlertIcon className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong className="font-semibold">Can&apos;t be fixed by going in more.</strong>{' '}
              {suggestion.unresolvedWindows.length} upcoming week
              {suggestion.unresolvedWindows.length === 1 ? '' : 's'} (from{' '}
              {formatShort(suggestion.unresolvedWindows[0])}) fall short no matter what you do,
              because past weeks are already locked in. Worth raising with HR.
            </span>
          </p>
        </div>
      )}
    </section>
  );
}
