import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

export async function holidayRoutes(app: FastifyInstance) {
  app.get('/holidays', async () => {
    return prisma.holiday.findMany({ orderBy: { date: 'asc' } });
  });

  app.put('/holidays/:date', async (req, reply) => {
    const { date } = z.object({ date: ISO_DATE }).parse(req.params);
    const { name } = z.object({ name: z.string().max(100).optional() }).parse(req.body ?? {});
    const row = await prisma.holiday.upsert({
      where: { date },
      update: { name },
      create: { date, name },
    });
    return reply.send(row);
  });

  app.delete('/holidays/:date', async (req, reply) => {
    const { date } = z.object({ date: ISO_DATE }).parse(req.params);
    await prisma.holiday.deleteMany({ where: { date } });
    return reply.code(204).send();
  });
}
