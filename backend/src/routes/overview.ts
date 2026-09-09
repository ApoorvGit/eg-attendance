import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { computeCompliance, suggestOfficeDays } from '@eg-attendance/domain';
import { buildAttendanceInput, getSettings } from '../attendanceInput.js';

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

/** Single round-trip for the frontend: current compliance status + the live suggestion
 * plan, both derived fresh from whatever is actually in the DB right now. */
export async function overviewRoutes(app: FastifyInstance) {
  app.get('/overview', async (req) => {
    const query = z.object({ today: ISO_DATE.optional() }).parse(req.query);
    const today = query.today ?? new Date().toISOString().slice(0, 10);

    const [input, settings] = await Promise.all([buildAttendanceInput(today), getSettings()]);

    const compliance = computeCompliance(input);
    const suggestion = suggestOfficeDays(input, { safetyBufferDays: settings.safetyBufferDays });

    return { today, compliance, suggestion };
  });
}
