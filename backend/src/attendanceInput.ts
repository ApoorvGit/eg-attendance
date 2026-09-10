import type { AttendanceInput, DayStatus } from '@eg-attendance/domain';
import { prisma } from './db.js';

const DEFAULT_SETTINGS = {
  employmentStartDate: null as string | null,
  safetyBufferDays: 2,
  workDays: '1,2,3,4,5',
};

/** The singleton settings row is seeded by a migration, so this is normally a plain read.
 * The create-on-miss path exists only for databases predating that migration -- and it
 * tolerates losing an insert race (Prisma's upsert is not atomic here: concurrent callers
 * such as /overview reading settings while building its input both see no row, and the
 * loser gets P2002), so it re-reads instead of failing the request. */
export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (existing) return existing;

  try {
    return await prisma.settings.create({ data: { id: 1, ...DEFAULT_SETTINGS } });
  } catch {
    return prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
  }
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
