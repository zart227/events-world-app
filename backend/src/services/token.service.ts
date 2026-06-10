import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UnauthorizedError } from '../errors/app-error.js';
import { logger } from '../logger/logger.js';
import { withTransaction } from '../db/pool.js';
import {
  refreshTokenRepository,
  type RefreshTokenEntity,
} from '../repositories/refresh-token.repository.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const tokenService = {
  signAccessToken(user: AuthUser): string {
    const payload: Omit<AccessTokenPayload, 'sub'> = { email: user.email, role: user.role };
    const options: jwt.SignOptions = {
      subject: user.id,
      expiresIn: config.auth.accessTtl as Exclude<jwt.SignOptions['expiresIn'], undefined>,
    };
    return jwt.sign(payload, config.auth.accessSecret, options);
  },

  verifyAccessToken(token: string): AuthUser {
    try {
      const payload = jwt.verify(token, config.auth.accessSecret) as AccessTokenPayload;
      return { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      throw new UnauthorizedError('Невалидный или истёкший access-токен');
    }
  },

  async issueRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + config.auth.refreshTtlDays * 24 * 60 * 60 * 1000);
    await refreshTokenRepository.create({ userId, tokenHash: hashToken(token), expiresAt });
    return token;
  },

  /**
   * Ротация refresh-токена: старый отзывается, выдаётся новый.
   * Повторное использование уже отозванного токена расценивается как кража —
   * отзываются все сессии пользователя.
   */
  async rotateRefreshToken(token: string): Promise<{ userId: string; refreshToken: string }> {
    const stored = await refreshTokenRepository.findByHash(hashToken(token));
    if (!stored) {
      throw new UnauthorizedError('Refresh-токен не найден');
    }
    if (stored.revoked_at) {
      logger.warn(
        { userId: stored.user_id },
        'Refresh token reuse detected, revoking all sessions',
      );
      await refreshTokenRepository.revokeAllForUser(stored.user_id);
      throw new UnauthorizedError('Refresh-токен отозван');
    }
    if (stored.expires_at.getTime() <= Date.now()) {
      throw new UnauthorizedError('Refresh-токен истёк');
    }

    const newToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + config.auth.refreshTtlDays * 24 * 60 * 60 * 1000);
    await withTransaction(async (client) => {
      await refreshTokenRepository.revokeById(stored.id, client);
      await refreshTokenRepository.create(
        { userId: stored.user_id, tokenHash: hashToken(newToken), expiresAt },
        client,
      );
    });

    return { userId: stored.user_id, refreshToken: newToken };
  },

  async revokeRefreshToken(token: string): Promise<RefreshTokenEntity | null> {
    const stored = await refreshTokenRepository.findByHash(hashToken(token));
    if (stored && !stored.revoked_at) {
      await refreshTokenRepository.revokeById(stored.id);
    }
    return stored;
  },

  async revokeAllSessions(userId: string): Promise<number> {
    return refreshTokenRepository.revokeAllForUser(userId);
  },
};

export type TokenService = typeof tokenService;
