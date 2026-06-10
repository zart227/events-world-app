import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { config } from '../config/env.js';
import { connectRedis, redis } from '../db/redis.js';

const passthrough: RequestHandler = (_req, _res, next) => next();

// Лимитеры создаются при импорте модуля — дожидаемся соединения с Redis лениво
let redisReady: Promise<void> | null = null;

function ensureRedis(): Promise<void> {
  redisReady ??= connectRedis();
  return redisReady;
}

function createLimiter(options: { windowMs: number; limit: number; prefix: string }): RequestHandler {
  if (!config.rateLimit.enabled) {
    return passthrough;
  }
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Слишком много запросов, попробуйте позже', code: 'TOO_MANY_REQUESTS' },
    store: new RedisStore({
      prefix: options.prefix,
      sendCommand: async (command, ...args) => {
        await ensureRedis();
        return redis.sendCommand([command, ...args]);
      },
    }),
  });
}

/** Глобальный лимит на все /api запросы. */
export const globalLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 300,
  prefix: 'rl:global:',
});

/** Жёсткий лимит на /api/auth/* — защита от перебора паролей. */
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  prefix: 'rl:auth:',
});
