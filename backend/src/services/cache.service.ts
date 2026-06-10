import { redis } from '../db/redis.js';
import { logger } from '../logger/logger.js';

/**
 * Тонкая JSON-обёртка над Redis. Ошибки кэша не валят запрос —
 * приложение продолжает работать без кэша.
 */
export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      logger.warn({ err, key }, 'Cache read failed');
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), { expiration: { type: 'EX', value: ttlSeconds } });
    } catch (err) {
      logger.warn({ err, key }, 'Cache write failed');
    }
  },
};

export type CacheService = typeof cacheService;
