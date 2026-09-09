'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  api,
  ApiError,
  clearAccessCode,
  type AttendanceDayRow,
  type BlockedDateRow,
  type OverviewResponse,
  type SettingsPayload,
} from '@/lib/api';
import { addDaysISO, todayLocalISO } from '@/lib/dates';
import { ComplianceCard } from './ComplianceCard';
import { SuggestionCard } from './SuggestionCard';
import { AttendanceLog } from './AttendanceLog';
import { BlockedDates } from './BlockedDates';
import { SettingsPanel } from './SettingsPanel';

export function Dashboard() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [attendance, setAttendance] = useState<AttendanceDayRow[]>([]);
  const [blocked, setBlocked] = useState<BlockedDateRow[]>([]);
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const today = todayLocalISO();
    try {
      const [ov, att, bl, st] = await Promise.all([
        api.overview(today),
        api.listAttendance(addDaysISO(today, -90), addDaysISO(today, 120)),
        api.listBlockedDates(),
        api.getSettings(),
      ]);
      setOverview(ov);
      setAttendance(att);
      setBlocked(bl);
      setSettings(st);
      setError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearAccessCode();
        window.location.reload();
        return;
      }
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      await refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearAccessCode();
        window.location.reload();
        return;
      }
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto mt-24 max-w-md px-4 text-center text-sm text-red-700">
        {error}
        <button onClick={() => refresh()} className="ml-2 underline">
          Retry
        </button>
      </div>
    );
  }

  if (!overview || !settings) {
    return <div className="mx-auto mt-24 text-center text-sm text-neutral-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <h1 className="text-xl font-semibold">Office Attendance Planner</h1>

      <ComplianceCard compliance={overview.compliance} />

      <SuggestionCard
        suggestion={overview.suggestion}
        busy={busy}
        onMarkDone={(date) => withBusy(() => api.setAttendance(date, 'OFFICE').then(() => {}))}
        onCantMake={(date) => withBusy(() => api.setBlockedDate(date, 'unavailable').then(() => {}))}
      />

      <AttendanceLog
        rows={attendance}
        busy={busy}
        onSet={(date, status) => withBusy(() => api.setAttendance(date, status).then(() => {}))}
        onClear={(date) => withBusy(() => api.clearAttendance(date))}
      />

      <BlockedDates
        rows={blocked}
        busy={busy}
        onAdd={(date, reason) => withBusy(() => api.setBlockedDate(date, reason).then(() => {}))}
        onRemove={(date) => withBusy(() => api.clearBlockedDate(date))}
      />

      <SettingsPanel
        settings={settings}
        busy={busy}
        onSave={(patch) => withBusy(() => api.patchSettings(patch).then(() => {}))}
      />
    </div>
  );
}
