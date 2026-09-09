import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { suggestOfficeDays } from '@eg-attendance/domain';
import { buildAttendanceInput, getSettings } from '../attendanceInput.js';

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

export async function suggestionRoutes(app: FastifyInstance) {
  app.get('/suggestions', async (req) => {
    const query = z
      .object({ today: ISO_DATE.optional(), horizonWeeksAhead: z.coerce.number().int().min(1).max(52).optional() })
      .parse(req.query);
    const today = query.today ?? new Date().toISOString().slice(0, 10);
    const [input, settings] = await Promise.all([buildAttendanceInput(today), getSettings()]);
    return suggestOfficeDays(input, {
      horizonWeeksAhead: query.horizonWeeksAhead,
      safetyBufferDays: settings.safetyBufferDays,
    });
  });
}
