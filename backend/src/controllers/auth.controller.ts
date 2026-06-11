import type { CookieOptions, Request, Response } from 'express';
import { config } from '../config/env.js';
import type { CredentialsDto } from '../dto/auth.dto.js';
import { UnauthorizedError } from '../errors/app-error.js';
import { getAuthUser } from '../middlewares/auth.js';
import { getValidated } from '../middlewares/validate.js';
import { authService, type AuthResult } from '../services/auth.service.js';

export const REFRESH_COOKIE = 'refreshToken';

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: config.auth.refreshTtlDays * 24 * 60 * 60 * 1000,
};

function sendAuthResult(res: Response, result: AuthResult, status = 200): void {
  res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions);
  res.status(status).json({ user: result.user, accessToken: result.accessToken });
}

function getRefreshCookie(req: Request): string {
  const token = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE];
  if (!token) {
    throw new UnauthorizedError('Refresh-токен отсутствует');
  }
  return token;
}

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const credentials = getValidated<CredentialsDto>(req, 'body');
    const result = await authService.register(credentials);
    req.log.info({ userId: result.user.id }, 'User registered');
    sendAuthResult(res, result, 201);
  },

  async login(req: Request, res: Response): Promise<void> {
    const credentials = getValidated<CredentialsDto>(req, 'body');
    const result = await authService.login(credentials);
    req.log.info({ userId: result.user.id }, 'User logged in');
    sendAuthResult(res, result);
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const result = await authService.refresh(getRefreshCookie(req));
    sendAuthResult(res, result);
  },

  async logout(req: Request, res: Response): Promise<void> {
    const token = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE];
    if (token) {
      await authService.logout(token);
    }
    res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions, maxAge: undefined });
    res.status(204).send();
  },

  async logoutAll(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const revoked = await authService.logoutAll(user.id);
    res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions, maxAge: undefined });
    req.log.info({ userId: user.id, revoked }, 'All sessions revoked');
    res.status(204).send();
  },
};
