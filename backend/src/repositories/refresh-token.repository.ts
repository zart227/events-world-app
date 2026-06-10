import type pg from 'pg';
import { pool } from '../db/pool.js';

export interface RefreshTokenEntity {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

const COLUMNS = 'id, user_id, token_hash, expires_at, revoked_at, created_at';

export const refreshTokenRepository = {
  async create(
    data: { userId: string; tokenHash: string; expiresAt: Date },
    client: pg.Pool | pg.PoolClient = pool,
  ): Promise<RefreshTokenEntity> {
    const { rows } = await client.query<RefreshTokenEntity>(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING ${COLUMNS}`,
      [data.userId, data.tokenHash, data.expiresAt],
    );
    return rows[0]!;
  },

  async findByHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    const { rows } = await pool.query<RefreshTokenEntity>(
      `SELECT ${COLUMNS} FROM refresh_tokens WHERE token_hash = $1`,
      [tokenHash],
    );
    return rows[0] ?? null;
  },

  async revokeById(id: string, client: pg.Pool | pg.PoolClient = pool): Promise<void> {
    await client.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL',
      [id],
    );
  },

  async revokeAllForUser(userId: string): Promise<number> {
    const result = await pool.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId],
    );
    return result.rowCount ?? 0;
  },

  async deleteExpired(): Promise<number> {
    const result = await pool.query('DELETE FROM refresh_tokens WHERE expires_at < now()');
    return result.rowCount ?? 0;
  },
};

export type RefreshTokenRepository = typeof refreshTokenRepository;
