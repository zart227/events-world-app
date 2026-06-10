import { logger } from '../logger/logger.js';
import { runMigrations } from './migrate.js';
import { closePool, pool } from './pool.js';

try {
  await runMigrations(pool);
  logger.info('Migrations are up to date');
} catch (err) {
  logger.fatal({ err }, 'Migration failed');
  process.exitCode = 1;
} finally {
  await closePool();
}
