import { Router } from 'express';
import { pool } from '../db/pool.js';
import { redis } from '../db/redis.js';

export const healthRouter = Router();

/** Liveness: процесс жив. */
healthRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

/** Readiness: PostgreSQL и Redis доступны. */
healthRouter.get('/ready', async (_req, res) => {
  const checks: Record<string, 'ok' | 'fail'> = { postgres: 'fail', redis: 'fail' };

  try {
    await pool.query('SELECT 1');
    checks['postgres'] = 'ok';
  } catch {
    /* остаётся fail */
  }

  try {
    if (redis.isOpen) {
      await redis.ping();
      checks['redis'] = 'ok';
    }
  } catch {
    /* остаётся fail */
  }

  const ready = Object.values(checks).every((s) => s === 'ok');
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', checks });
});
