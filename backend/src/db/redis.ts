import { createClient, type RedisClientType } from 'redis';
import { config } from '../config/env.js';
import { logger } from '../logger/logger.js';

export const redis: RedisClientType = createClient({ url: config.redis.url });

redis.on('error', (err) => {
  logger.error({ err }, 'Redis client error');
});

export async function connectRedis(): Promise<void> {
  if (!redis.isOpen) {
    await redis.connect();
    logger.info({ url: config.redis.url }, 'Redis connected');
  }
}

export async function closeRedis(): Promise<void> {
  if (redis.isOpen) {
    await redis.close();
    logger.info('Redis connection closed');
  }
}
