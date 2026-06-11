import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

const backendRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(backendRoot, '..');

dotenv.config({
  path: [path.join(backendRoot, '.env'), path.join(repoRoot, '.env')],
  quiet: true,
});

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // prisma generate не подключается к БД; fallback нужен для CI и npm ci без .env
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/events_world',
  },
});
