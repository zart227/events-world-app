import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = path.resolve(backendRoot, '..');

// backend/.env имеет приоритет, корневой .env — для общих переменных (legacy)
dotenv.config({ path: [path.join(backendRoot, '.env'), path.join(repoRoot, '.env')], quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SERVER_PORT: z.coerce.number().int().positive().default(3001),
  CLIENT_PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z
    .url({ protocol: /^postgres(ql)?$/ })
    .default('postgresql://postgres:postgres@localhost:5432/events_world'),
  PG_POOL_SIZE: z.coerce.number().int().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Логгер ещё не инициализирован — конфиг валидируется до всего остального
  console.error('Invalid environment configuration:\n', z.prettifyError(parsed.error));
  process.exit(1);
}

const env = parsed.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  server: {
    port: env.SERVER_PORT,
  },
  cors: {
    origin: env.CORS_ORIGIN ?? `http://localhost:${env.CLIENT_PORT}`,
  },
  log: {
    level: env.LOG_LEVEL,
  },
  postgres: {
    url: env.DATABASE_URL,
    poolSize: env.PG_POOL_SIZE,
  },
} as const;

export type Config = typeof config;
