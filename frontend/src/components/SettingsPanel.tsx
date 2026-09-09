'use client';

import { useState } from 'react';
import type { SettingsPayload } from '@/lib/api';

export function SettingsPanel({
  settings,
  onSave,
  busy,
}: {
  settings: SettingsPayload;
  onSave: (patch: Partial<SettingsPayload>) => void;
  busy: boolean;
}) {
  const [buffer, setBuffer] = useState(settings.safetyBufferDays);
  const [employmentStart, setEmploymentStart] = useState(settings.employmentStartDate ?? '');

  return (
    <section className="rounded-lg border border-neutral-200 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Settings</h2>

      <div className="mt-3 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-neutral-500">Safety buffer (days above 24)</label>
          <input
            type="number"
            min={0}
            max={10}
            value={buffer}
            onChange={(e) => setBuffer(Number(e.target.value))}
            className="mt-1 w-20 rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500">Employment start date (optional)</label>
          <input
            type="date"
            value={employmentStart}
            onChange={(e) => setEmploymentStart(e.target.value)}
            className="mt-1 rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          disabled={busy}
          onClick={() =>
            onSave({
              safetyBufferDays: buffer,
              employmentStartDate: employmentStart || null,
            })
          }
          className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          Save
        </button>
      </div>
      <p className="mt-2 text-[11px] text-neutral-400">
        Set employment start date only if you&apos;ve been here less than 12 weeks -- it keeps
        weeks before you joined out of the compliance window instead of counting them as gaps.
      </p>
    </section>
  );
}
