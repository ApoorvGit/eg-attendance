import type { ComplianceWindow, SuggestionResult } from '@eg-attendance/domain';

const ACCESS_CODE_KEY = 'eg-attendance:access-code';

export function getAccessCode(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_CODE_KEY);
}

export function setAccessCode(code: string) {
  window.localStorage.setItem(ACCESS_CODE_KEY, code);
}

export function clearAccessCode() {
  window.localStorage.removeItem(ACCESS_CODE_KEY);
}

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error('NEXT_PUBLIC_API_URL is not set');
  return url.replace(/\/$/, '');
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const code = getAccessCode();
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${code ?? ''}`,
      ...init.headers,
    },
  });
  if (res.status === 401) {
    clearAccessCode();
    throw new ApiError(401, 'Access code rejected');
  }
  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface AttendanceDayRow {
  date: string;
  status: 'OFFICE' | 'ABSENT';
}

export interface BlockedDateRow {
  date: string;
  reason: string | null;
}

export interface HolidayRow {
  date: string;
  name: string | null;
}

export interface SettingsPayload {
  employmentStartDate: string | null;
  safetyBufferDays: number;
  workDays: number[];
}

export interface OverviewResponse {
  today: string;
  compliance: ComplianceWindow;
  suggestion: SuggestionResult;
}

export const api = {
  overview: (today?: string) =>
    request<OverviewResponse>(`/overview${today ? `?today=${today}` : ''}`),

  listAttendance: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return request<AttendanceDayRow[]>(`/attendance${qs ? `?${qs}` : ''}`);
  },
  setAttendance: (date: string, status: 'OFFICE' | 'ABSENT') =>
    request<AttendanceDayRow>(`/attendance/${date}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  clearAttendance: (date: string) => request<void>(`/attendance/${date}`, { method: 'DELETE' }),

  listBlockedDates: () => request<BlockedDateRow[]>('/blocked-dates'),
  setBlockedDate: (date: string, reason?: string) =>
    request<BlockedDateRow>(`/blocked-dates/${date}`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  clearBlockedDate: (date: string) => request<void>(`/blocked-dates/${date}`, { method: 'DELETE' }),

  listHolidays: () => request<HolidayRow[]>('/holidays'),
  setHoliday: (date: string, name?: string) =>
    request<HolidayRow>(`/holidays/${date}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  clearHoliday: (date: string) => request<void>(`/holidays/${date}`, { method: 'DELETE' }),

  getSettings: () => request<SettingsPayload>('/settings'),
  patchSettings: (patch: Partial<SettingsPayload>) =>
    request<SettingsPayload>('/settings', { method: 'PATCH', body: JSON.stringify(patch) }),
};
