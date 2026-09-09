import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (Neon connection string)'),
  APP_SECRET: z.string().min(16, 'APP_SECRET must be at least 16 characters'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:3000'),
  PORT: z.coerce.number().default(4000),
});

export const env = EnvSchema.parse(process.env);
