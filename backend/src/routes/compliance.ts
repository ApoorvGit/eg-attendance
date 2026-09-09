import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { computeCompliance } from '@eg-attendance/domain';
import { buildAttendanceInput } from '../attendanceInput.js';

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

export async function complianceRoutes(app: FastifyInstance) {
  app.get('/compliance', async (req) => {
    const query = z.object({ today: ISO_DATE.optional() }).parse(req.query);
    const today = query.today ?? new Date().toISOString().slice(0, 10);
    const input = await buildAttendanceInput(today);
    return computeCompliance(input);
  });
}
