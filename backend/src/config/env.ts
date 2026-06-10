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
  REDIS_URL: z.url({ protocol: /^redis$/ }).default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(16).default('dev-access-secret-change-me'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  ADMIN_EMAILS: z.string().default(''),
  RATE_LIMIT_ENABLED: z.stringbool().default(true),
});

const parsed = envSchema
  .check((ctx) => {
    if (ctx.value.NODE_ENV === 'production' && ctx.value.JWT_ACCESS_SECRET.startsWith('dev-')) {
      ctx.issues.push({
        code: 'custom',
        message: 'JWT_ACCESS_SECRET must be set explicitly in production',
        input: ctx.value.JWT_ACCESS_SECRET,
        path: ['JWT_ACCESS_SECRET'],
      });
    }
  })
  .safeParse(process.env);

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
  redis: {
    url: env.REDIS_URL,
  },
  auth: {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    refreshTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
    adminEmails: env.ADMIN_EMAILS.split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  },
  rateLimit: {
    enabled: env.RATE_LIMIT_ENABLED && env.NODE_ENV !== 'test',
  },
} as const;

export type Config = typeof config;
