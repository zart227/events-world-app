import { createApp } from './app.js';
import { config } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { closePool, pool } from './db/pool.js';
import { closeRedis, connectRedis } from './db/redis.js';
import { startPollutionRefreshJob } from './jobs/pollution-refresh.job.js';
import { logger } from './logger/logger.js';
import { closeSocket, initSocket } from './ws/socket.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function main(): Promise<void> {
  await runMigrations(pool);
  await connectRedis();

  const app = createApp();
  const server = app.listen(config.server.port, () => {
    logger.info(`Server started on http://localhost:${config.server.port}`);
  });

  initSocket(server);
  const cronTask = startPollutionRefreshJob();

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down gracefully...');

    // Страховка: если зависнем — выходим принудительно
    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    void (async () => {
      try {
        if (cronTask) {
          await cronTask.destroy();
        }
        // io.close() закрывает и привязанный HTTP-сервер
        await closeSocket();
        await new Promise<void>((resolve, reject) => {
          server.close((err) => {
            if (err && (err as NodeJS.ErrnoException).code !== 'ERR_SERVER_NOT_RUNNING') {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        await closeRedis();
        await closePool();
        logger.info('Shutdown complete');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    })();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
