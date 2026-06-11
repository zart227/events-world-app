import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';

let pg: StartedPostgreSqlContainer;
let redis: StartedRedisContainer;

/**
 * Поднимает PostgreSQL и Redis в контейнерах один раз на весь прогон.
 * Переменные окружения наследуются воркерами vitest.
 */
export async function setup(): Promise<void> {
  [pg, redis] = await Promise.all([
    new PostgreSqlContainer('postgres:17').start(),
    new RedisContainer('redis:8').start(),
  ]);

  process.env['NODE_ENV'] = 'test';
  process.env['DATABASE_URL'] = pg.getConnectionUri();
  process.env['REDIS_URL'] = redis.getConnectionUrl();
  process.env['JWT_ACCESS_SECRET'] = 'test-access-secret-0123456789';
  process.env['JWT_ACCESS_TTL'] = '15m';
  process.env['ADMIN_EMAILS'] = 'admin@test.local';
  process.env['LOG_LEVEL'] = 'fatal';
  process.env['OPENWEATHERMAP_API_KEY'] = 'test-owm-key';
}

export async function teardown(): Promise<void> {
  await Promise.all([pg.stop(), redis.stop()]);
}
