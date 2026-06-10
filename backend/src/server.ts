import { createApp } from './app.js';
import { config } from './config/env.js';
import { closeMongo, connectMongo } from './db/mongo.js';
import { logger } from './logger/logger.js';

async function main(): Promise<void> {
  await connectMongo();

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
      await closeMongo();
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
