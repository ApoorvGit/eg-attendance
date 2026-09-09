import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
const UpsertBody = z.object({ status: z.enum(['OFFICE', 'ABSENT']) });

export async function attendanceRoutes(app: FastifyInstance) {
  app.get('/attendance', async (req) => {
    const query = z.object({ from: ISO_DATE.optional(), to: ISO_DATE.optional() }).parse(req.query);
    const rows = await prisma.attendanceDay.findMany({
      where: {
        date: {
          gte: query.from,
          lte: query.to,
        },
      },
      orderBy: { date: 'asc' },
    });
    return rows;
  });

  app.put('/attendance/:date', async (req, reply) => {
    const { date } = z.object({ date: ISO_DATE }).parse(req.params);
    const { status } = UpsertBody.parse(req.body);
    const row = await prisma.attendanceDay.upsert({
      where: { date },
      update: { status },
      create: { date, status },
    });
    return reply.send(row);
  });

  app.delete('/attendance/:date', async (req, reply) => {
    const { date } = z.object({ date: ISO_DATE }).parse(req.params);
    await prisma.attendanceDay.deleteMany({ where: { date } });
    return reply.code(204).send();
  });
}
