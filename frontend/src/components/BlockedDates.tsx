'use client';

import { useState } from 'react';
import type { BlockedDateRow } from '@/lib/api';
import { addDaysISO, formatShort, todayLocalISO, weekdayShort } from '@/lib/dates';

export function BlockedDates({
  rows,
  onAdd,
  onRemove,
  busy,
}: {
  rows: BlockedDateRow[];
  onAdd: (date: string, reason: string) => void;
  onRemove: (date: string) => void;
  busy: boolean;
}) {
  const today = todayLocalISO();
  const [date, setDate] = useState(addDaysISO(today, 1));
  const [reason, setReason] = useState('');
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section className="rounded-lg border border-neutral-200 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Days you can&apos;t go in
      </h2>
      <p className="mt-1 text-xs text-neutral-500">
        Mark leave, travel, or any day you already know you&apos;ll be out. Suggestions will work
        around these automatically.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs text-neutral-500">Date</label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-neutral-500">Reason (optional)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. travel"
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          disabled={busy}
          onClick={() => {
            onAdd(date, reason);
            setReason('');
          }}
          className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {sorted.length > 0 && (
        <ul className="mt-3 space-y-1">
          {sorted.map((row) => (
            <li
              key={row.date}
              className="flex items-center justify-between rounded border border-neutral-100 px-2 py-1.5 text-sm"
            >
              <span>
                <span className="font-medium">{weekdayShort(row.date)}</span>{' '}
                <span className="text-neutral-500">{formatShort(row.date)}</span>
                {row.reason ? <span className="text-neutral-400"> -- {row.reason}</span> : null}
              </span>
              <button
                disabled={busy}
                onClick={() => onRemove(row.date)}
                className="rounded bg-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
