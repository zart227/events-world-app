import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma, runMigrations } from '../src/db/prisma.js';
import { connectRedis, redis } from '../src/db/redis.js';

let appInstance: Express | null = null;

/** Инициализирует приложение (миграции + Redis) один раз на воркер. */
export async function getTestApp(): Promise<Express> {
  if (!appInstance) {
    runMigrations();
    await connectRedis();
    await prisma.$connect();
    appInstance = createApp();
  }
  return appInstance;
}

export async function truncateAll(): Promise<void> {
  await prisma.$executeRaw`
    TRUNCATE users, refresh_tokens, user_settings, articles,
             pollution_history, city_subscriptions CASCADE
  `;
  await redis.flushAll();
}

export interface TestUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  accessToken: string;
  refreshCookie: string;
}

export function extractRefreshCookie(res: { headers: Record<string, unknown> }): string {
  const cookies = res.headers['set-cookie'] as string[] | undefined;
  const cookie = cookies?.find((c) => c.startsWith('refreshToken='));
  if (!cookie) {
    throw new Error('refreshToken cookie is not set');
  }
  return cookie.split(';')[0]!;
}

export async function registerUser(
  app: Express,
  email: string,
  password = 'password123',
): Promise<TestUser> {
  const res = await request(app).post('/api/auth/register').send({ email, password }).expect(201);
  return {
    id: res.body.user.id,
    email: res.body.user.email,
    role: res.body.user.role,
    accessToken: res.body.accessToken,
    refreshCookie: extractRefreshCookie(res),
  };
}

export const samplePollution = {
  address: 'Москва',
  latitude: '55.75',
  longitude: '37.61',
  components: {
    co: 201.94,
    no: 0.01,
    no2: 0.77,
    o3: 68.66,
    so2: 0.64,
    pm2_5: 0.5,
    pm10: 0.54,
    nh3: 0.12,
  },
  aqi: 2,
  dateTime: '01.06.2026 12:00:00',
};
