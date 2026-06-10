import type pg from 'pg';
import { pool, withTransaction } from '../db/pool.js';

export interface UserEntity {
  id: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  created_at: Date;
}

const USER_COLUMNS = 'id, email, password_hash, role, created_at';

export const userRepository = {
  /**
   * Создаёт пользователя вместе с первичными настройками — в одной транзакции.
   */
  async createWithSettings(data: {
    email: string;
    passwordHash: string;
    role?: 'user' | 'admin';
  }): Promise<UserEntity> {
    return withTransaction(async (client) => {
      const { rows } = await client.query<UserEntity>(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING ${USER_COLUMNS}`,
        [data.email, data.passwordHash, data.role ?? 'user'],
      );
      const user = rows[0]!;
      await client.query('INSERT INTO user_settings (user_id) VALUES ($1)', [user.id]);
      return user;
    });
  },

  async findByEmail(
    email: string,
    client: pg.Pool | pg.PoolClient = pool,
  ): Promise<UserEntity | null> {
    const { rows } = await client.query<UserEntity>(
      `SELECT ${USER_COLUMNS} FROM users WHERE email = $1`,
      [email],
    );
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<UserEntity | null> {
    const { rows } = await pool.query<UserEntity>(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  },
};

export type UserRepository = typeof userRepository;
