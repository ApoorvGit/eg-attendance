'use client';

import { useState } from 'react';
import type { AttendanceDayRow } from '@/lib/api';
import { addDaysISO, formatShort, todayLocalISO, weekdayShort } from '@/lib/dates';

export function AttendanceLog({
  rows,
  onSet,
  onClear,
  busy,
}: {
  rows: AttendanceDayRow[];
  onSet: (date: string, status: 'OFFICE' | 'ABSENT') => void;
  onClear: (date: string) => void;
  busy: boolean;
}) {
  const today = todayLocalISO();
  const [pickDate, setPickDate] = useState(today);
  const byDate = new Map(rows.map((r) => [r.date, r.status]));

  const recentDates = Array.from({ length: 14 }, (_, i) => addDaysISO(today, -i));

  return (
    <section className="rounded-lg border border-neutral-200 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Log attendance
      </h2>

      <div className="mt-3 flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-xs text-neutral-500">Date</label>
          <input
            type="date"
            value={pickDate}
            max={today}
            onChange={(e) => setPickDate(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          disabled={busy}
          onClick={() => onSet(pickDate, 'OFFICE')}
          className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          Office
        </button>
        <button
          disabled={busy}
          onClick={() => onSet(pickDate, 'ABSENT')}
          className="rounded bg-neutral-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          Absent
        </button>
      </div>

      <div className="mt-4">
        <p className="mb-1 text-xs text-neutral-500">Last 14 days</p>
        <div className="flex flex-wrap gap-1">
          {recentDates.map((d) => {
            const status = byDate.get(d);
            return (
              <button
                key={d}
                disabled={busy}
                title={`${weekdayShort(d)} ${formatShort(d)}${status ? ` -- ${status}` : ' -- not logged'}`}
                onClick={() => {
                  if (!status) onSet(d, 'OFFICE');
                  else if (status === 'OFFICE') onSet(d, 'ABSENT');
                  else onClear(d);
                }}
                className={`flex h-10 w-10 flex-col items-center justify-center rounded text-[10px] font-medium disabled:opacity-50 ${
                  status === 'OFFICE'
                    ? 'bg-green-600 text-white'
                    : status === 'ABSENT'
                      ? 'bg-neutral-400 text-white'
                      : 'bg-neutral-100 text-neutral-400 ring-1 ring-inset ring-amber-300'
                }`}
              >
                <span>{formatShort(d).split(' ')[1]}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-[11px] text-neutral-400">
          Click to cycle: not logged → office → absent → not logged.
        </p>
      </div>
    </section>
  );
}
