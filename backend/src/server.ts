import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { env } from './env.js';
import { requireAuth } from './auth.js';
import { attendanceRoutes } from './routes/attendance.js';
import { blockedDatesRoutes } from './routes/blockedDates.js';
import { holidayRoutes } from './routes/holidays.js';
import { settingsRoutes } from './routes/settings.js';
import { complianceRoutes } from './routes/compliance.js';
import { suggestionRoutes } from './routes/suggestions.js';
import { overviewRoutes } from './routes/overview.js';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.FRONTEND_ORIGIN.split(',').map((s) => s.trim()),
});

app.setErrorHandler((err, _req, reply) => {
  if (err instanceof ZodError) {
    return reply.code(400).send({ error: 'invalid_request', issues: err.issues });
  }
  app.log.error(err);
  return reply.code(500).send({ error: 'internal_error' });
});

app.get('/health', async () => ({ ok: true }));

app.register(async (protected_) => {
  protected_.addHook('onRequest', requireAuth);
  await protected_.register(attendanceRoutes);
  await protected_.register(blockedDatesRoutes);
  await protected_.register(holidayRoutes);
  await protected_.register(settingsRoutes);
  await protected_.register(complianceRoutes);
  await protected_.register(suggestionRoutes);
  await protected_.register(overviewRoutes);
});

app
  .listen({ port: env.PORT, host: '0.0.0.0' })
  .then(() => app.log.info(`listening on ${env.PORT}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
