import type { AttendanceInput, DayStatus } from '@eg-attendance/domain';
import { prisma } from './db.js';

const DEFAULT_SETTINGS = {
  employmentStartDate: null as string | null,
  safetyBufferDays: 2,
  workDays: '1,2,3,4,5',
};

export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: 1, ...DEFAULT_SETTINGS } });
}

/** Builds the full domain-layer input from current DB state, as of `today`. */
export async function buildAttendanceInput(today: string): Promise<AttendanceInput> {
  const [records, blocked, holidays, settings] = await Promise.all([
    prisma.attendanceDay.findMany(),
    prisma.blockedDate.findMany(),
    prisma.holiday.findMany(),
    getSettings(),
  ]);

  return {
    today,
    records: records.map((r) => ({ date: r.date, status: r.status as DayStatus })),
    blockedDates: blocked.map((b) => b.date),
    holidays: holidays.map((h) => h.date),
    workDays: settings.workDays.split(',').map(Number),
    employmentStartDate: settings.employmentStartDate ?? undefined,
  };
}
