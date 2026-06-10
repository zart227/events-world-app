import { createApp } from './app.js';
import { config } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { closePool, pool } from './db/pool.js';
import { closeRedis, connectRedis } from './db/redis.js';
import { logger } from './logger/logger.js';

async function main(): Promise<void> {
  await runMigrations(pool);
  await connectRedis();

  const app = createApp();
  const server = app.listen(config.server.port, () => {
    logger.info(`Server started on http://localhost:${config.server.port}`);
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Shutting down gracefully...');
    server.close(async (err) => {
      if (err) {
        logger.error({ err }, 'Error while closing HTTP server');
      }
      await closeRedis();
      await closePool();
      process.exit(err ? 1 : 0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
