import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

export async function blockedDatesRoutes(app: FastifyInstance) {
  app.get('/blocked-dates', async () => {
    return prisma.blockedDate.findMany({ orderBy: { date: 'asc' } });
  });

  app.put('/blocked-dates/:date', async (req, reply) => {
    const { date } = z.object({ date: ISO_DATE }).parse(req.params);
    const { reason } = z.object({ reason: z.string().max(200).optional() }).parse(req.body ?? {});
    const row = await prisma.blockedDate.upsert({
      where: { date },
      update: { reason },
      create: { date, reason },
    });
    return reply.send(row);
  });

  app.delete('/blocked-dates/:date', async (req, reply) => {
    const { date } = z.object({ date: ISO_DATE }).parse(req.params);
    await prisma.blockedDate.deleteMany({ where: { date } });
    return reply.code(204).send();
  });
}
