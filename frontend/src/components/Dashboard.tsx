'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  api,
  ApiError,
  clearAccessCode,
  type AttendanceDayRow,
  type BlockedDateRow,
  type HolidayRow,
  type OverviewResponse,
  type SettingsPayload,
} from '@/lib/api';
import { addDaysISO, mondayOfISO, todayLocalISO } from '@/lib/dates';
import { buildWeek, type DayCell, type DayContext } from '@/lib/dayState';
import { StatusHero } from './StatusHero';
import { WeekStrip } from './WeekStrip';
import { Disclosure } from './Disclosure';
import { HistoryStrip } from './HistoryStrip';
import { SettingsSheet } from './SettingsSheet';
import { GearIcon } from './Icons';

/** The compliance window is the 12 completed weeks before this one, so every one of
 * them must be reachable for logging -- otherwise history can't be backfilled or corrected. */
const PAST_WEEKS = 12;
/** Weeks of future shown, so trips months out can be blocked by tapping. Must stay at
 * least 12 below the planner's internal horizon (36) or the tail weeks aren't yet
 * fully constrained -- see SuggestOptions.horizonWeeksAhead. */
const FUTURE_WEEKS = 16;

export function Dashboard() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [attendance, setAttendance] = useState<AttendanceDayRow[]>([]);
  const [blocked, setBlocked] = useState<BlockedDateRow[]>([]);
  const [holidays, setHolidays] = useState<HolidayRow[]>([]);
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = todayLocalISO();

  const handleFailure = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 401) {
      clearAccessCode();
      window.location.reload();
      return;
    }
    setError(e instanceof Error ? e.message : 'Something went wrong');
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [ov, att, bl, hol, st] = await Promise.all([
        api.overview(today),
        api.listAttendance(addDaysISO(today, -120), addDaysISO(today, 150)),
        api.listBlockedDates(),
        api.listHolidays(),
        api.getSettings(),
      ]);
      setOverview(ov);
      setAttendance(att);
      setBlocked(bl);
      setHolidays(hol);
      setSettings(st);
      setError(null);
    } catch (e) {
      handleFailure(e);
    }
  }, [today, handleFailure]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const mutate = useCallback(
    async (fn: () => Promise<unknown>) => {
      setBusy(true);
      try {
        await fn();
        await refresh();
      } catch (e) {
        handleFailure(e);
      } finally {
        setBusy(false);
      }
    },
    [refresh, handleFailure],
  );

  /** Day taps apply locally first and revalidate afterwards, so backfilling a whole
   * quarter of history stays responsive instead of blocking on a round trip per cell.
   * Concurrent taps are counted, and the last one to settle triggers a single refresh --
   * the server stays the source of truth for the compliance numbers, which is why the
   * header shows a "checking" state until it has confirmed. */
  const inflight = useRef(0);
  const [syncing, setSyncing] = useState(false);

  const optimistic = useCallback(
    async (apply: () => void, call: () => Promise<unknown>) => {
      apply();
      inflight.current += 1;
      setSyncing(true);
      try {
        await call();
      } catch (e) {
        handleFailure(e);
      } finally {
        inflight.current -= 1;
        if (inflight.current === 0) {
          await refresh();
          setSyncing(false);
        }
      }
    },
    [refresh, handleFailure],
  );

  const setLocalAttendance = (date: string, status: 'OFFICE' | 'ABSENT' | null) =>
    setAttendance((rows) => {
      const rest = rows.filter((r) => r.date !== date);
      return status ? [...rest, { date, status }] : rest;
    });

  /** One tap, one meaning: past days record what happened, future days record
   * whether you can go. Never both on the same cell. */
  const onDayTap = useCallback(
    (day: DayCell) => {
      if (day.isLoggable) {
        if (day.kind === 'unlogged')
          return optimistic(
            () => setLocalAttendance(day.date, 'OFFICE'),
            () => api.setAttendance(day.date, 'OFFICE'),
          );
        if (day.kind === 'office')
          return optimistic(
            () => setLocalAttendance(day.date, 'ABSENT'),
            () => api.setAttendance(day.date, 'ABSENT'),
          );
        return optimistic(
          () => setLocalAttendance(day.date, null),
          () => api.clearAttendance(day.date),
        );
      }
      if (day.kind === 'blocked')
        return optimistic(
          () => setBlocked((rows) => rows.filter((r) => r.date !== day.date)),
          () => api.clearBlockedDate(day.date),
        );
      return optimistic(
        () => setBlocked((rows) => [...rows, { date: day.date, reason: null }]),
        () => api.setBlockedDate(day.date),
      );
    },
    [optimistic],
  );

  const ctx: DayContext | null = useMemo(() => {
    if (!overview || !settings) return null;
    return {
      today,
      attendance: new Map(attendance.map((r) => [r.date, r.status])),
      blocked: new Set(blocked.map((b) => b.date)),
      suggested: new Set(overview.suggestion.suggestedDates),
      holidays: new Set(holidays.map((h) => h.date)),
      workDays: settings.workDays,
    };
  }, [overview, settings, attendance, blocked, holidays, today]);

  const weeks = useMemo(() => {
    if (!ctx) return null;
    const thisMonday = mondayOfISO(today);
    const at = (offset: number) => buildWeek(addDaysISO(thisMonday, offset * 7), ctx);
    return {
      current: at(0),
      next: at(1),
      earlier: Array.from({ length: PAST_WEEKS }, (_, i) => at(-(PAST_WEEKS - i))),
      later: Array.from({ length: FUTURE_WEEKS - 1 }, (_, i) => at(i + 2)),
    };
  }, [ctx, today]);

  if (error) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-sm text-danger">{error}</p>
        <button
          onClick={() => refresh()}
          className="mt-3 cursor-pointer rounded-md bg-action px-4 py-2 text-sm font-medium text-action-foreground transition-opacity duration-200 hover:opacity-90"
        >
          Try again
        </button>
      </main>
    );
  }

  if (!overview || !settings || !weeks) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24">
        <div className="h-9 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-5 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-8 h-[68px] animate-pulse rounded-lg bg-muted" />
      </main>
    );
  }

  const laterGoIn = weeks.later.reduce((n, w) => n + w.goInCount, 0);
  const unloggedEarlier = weeks.earlier.reduce(
    (n, w) => n + w.days.filter((d) => d.kind === 'unlogged').length,
    0,
  );

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <StatusHero
        compliance={overview.compliance}
        suggestion={overview.suggestion}
        syncing={syncing}
      />

      <WeekStrip week={weeks.current} onDayTap={onDayTap} />
      <WeekStrip week={weeks.next} onDayTap={onDayTap} />

      <p className="mb-6 text-xs text-muted-foreground">
        Tap any day to change it. Past days record whether you went in; future days let you mark
        when you can&apos;t.
      </p>

      <Disclosure
        title="Later weeks"
        hint={laterGoIn > 0 ? `${laterGoIn} more days planned` : 'nothing planned'}
      >
        {weeks.later.map((w) => (
          <WeekStrip key={w.mondayISO} week={w} onDayTap={onDayTap} />
        ))}
      </Disclosure>

      <Disclosure
        title="Earlier weeks"
        hint={unloggedEarlier > 0 ? `${unloggedEarlier} days not logged` : 'all logged'}
      >
        {weeks.earlier.map((w) => (
          <WeekStrip key={w.mondayISO} week={w} onDayTap={onDayTap} />
        ))}
      </Disclosure>

      <Disclosure title="How this is calculated" hint={`${overview.compliance.top8Sum}/24 days`}>
        <HistoryStrip compliance={overview.compliance} />
      </Disclosure>

      <Disclosure title="Settings">
        <SettingsSheet
          settings={settings}
          busy={busy}
          onSave={(patch) => mutate(() => api.patchSettings(patch))}
        />
      </Disclosure>

      <footer className="mt-8 flex items-center gap-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
        <GearIcon className="size-3.5" />
        <span>
          Planning for {settings.safetyBufferDays} spare day
          {settings.safetyBufferDays === 1 ? '' : 's'} above the required 24
        </span>
      </footer>
    </main>
  );
}
