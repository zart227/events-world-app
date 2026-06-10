import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import { openApiDocument } from './docs/openapi.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { authLimiter, globalLimiter } from './middlewares/rate-limit.js';
import { requestLogger } from './middlewares/request-logger.js';
import { healthRouter } from './routes/health.router.js';
import { apiRouter } from './routes/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendBuildDir = path.resolve(dirname, '../../frontend/build');

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestLogger);
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    }),
  );

  app.use(healthRouter);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use('/api/auth', authLimiter);
  app.use('/api', globalLimiter);
  app.use('/api', apiRouter);
  app.use('/api', notFoundHandler);

  // Статика frontend-сборки + SPA-fallback (если сборка существует)
  if (fs.existsSync(frontendBuildDir)) {
    app.use(express.static(frontendBuildDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(frontendBuildDir, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}
