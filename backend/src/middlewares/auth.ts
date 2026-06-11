import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';
import { tokenService, type AuthUser } from '../services/token.service.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Требуется авторизация'));
    return;
  }
  req.user = tokenService.verifyAccessToken(header.slice('Bearer '.length));
  next();
};

export function requireRole(role: 'admin' | 'user'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError('Требуется авторизация'));
      return;
    }
    if (req.user.role !== role) {
      next(new ForbiddenError('Недостаточно прав'));
      return;
    }
    next();
  };
}

export function getAuthUser(req: Request): AuthUser {
  if (!req.user) {
    throw new UnauthorizedError('Требуется авторизация');
  }
  return req.user;
}
