import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { getSettings } from '../attendanceInput.js';

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

const PatchBody = z.object({
  employmentStartDate: ISO_DATE.nullable().optional(),
  safetyBufferDays: z.number().int().min(0).max(10).optional(),
  workDays: z
    .array(z.number().int().min(0).max(6))
    .min(1)
    .max(7)
    .optional(),
});

export async function settingsRoutes(app: FastifyInstance) {
  app.get('/settings', async () => {
    const s = await getSettings();
    return { ...s, workDays: s.workDays.split(',').map(Number) };
  });

  app.patch('/settings', async (req, reply) => {
    const body = PatchBody.parse(req.body);
    const current = await getSettings();
    const updated = await prisma.settings.update({
      where: { id: 1 },
      data: {
        employmentStartDate:
          body.employmentStartDate === undefined ? current.employmentStartDate : body.employmentStartDate,
        safetyBufferDays: body.safetyBufferDays ?? current.safetyBufferDays,
        workDays: body.workDays ? body.workDays.join(',') : current.workDays,
      },
    });
    return reply.send({ ...updated, workDays: updated.workDays.split(',').map(Number) });
  });
}
