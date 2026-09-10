'use client';

import { useState } from 'react';
import type { SettingsPayload } from '@/lib/api';

export function SettingsSheet({
  settings,
  onSave,
  busy,
}: {
  settings: SettingsPayload;
  onSave: (patch: Partial<SettingsPayload>) => void;
  busy: boolean;
}) {
  const [buffer, setBuffer] = useState(settings.safetyBufferDays);
  const [start, setStart] = useState(settings.employmentStartDate ?? '');
  const dirty = buffer !== settings.safetyBufferDays || start !== (settings.employmentStartDate ?? '');

  const field =
    'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground';

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="buffer" className="text-sm font-medium">
          Spare days to plan for
        </label>
        <p className="text-xs text-muted-foreground">
          Extra days planned above the required 24, so one missed day doesn&apos;t break
          compliance.
        </p>
        <input
          id="buffer"
          type="number"
          min={0}
          max={10}
          value={buffer}
          onChange={(e) => setBuffer(Number(e.target.value))}
          className={`${field} max-w-24`}
        />
      </div>

      <div>
        <label htmlFor="start" className="text-sm font-medium">
          Employment start date
        </label>
        <p className="text-xs text-muted-foreground">
          Only needed if you joined less than 12 weeks ago — keeps weeks before you joined out
          of the calculation.
        </p>
        <input
          id="start"
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className={`${field} max-w-48`}
        />
      </div>

      <button
        type="button"
        disabled={busy || !dirty}
        onClick={() => onSave({ safetyBufferDays: buffer, employmentStartDate: start || null })}
        className="cursor-pointer rounded-md bg-action px-4 py-2 text-sm font-medium text-action-foreground transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        {dirty ? 'Save changes' : 'Saved'}
      </button>
    </div>
  );
}
