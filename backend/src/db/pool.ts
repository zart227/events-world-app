import pg from 'pg';
import { config } from '../config/env.js';
import { logger } from '../logger/logger.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.postgres.url,
  max: config.postgres.poolSize,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected PostgreSQL pool error');
});

/** Выполняет колбэк в транзакции, отдавая ему выделенный клиент. */
export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('PostgreSQL pool closed');
}
