import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { z, type ZodType } from 'zod';
import { ValidationError } from '../errors/app-error.js';

type RequestPart = 'body' | 'params' | 'query';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validated: Partial<Record<RequestPart, unknown>>;
    }
  }
}

/**
 * Валидирует часть запроса по zod-схеме. Результат парсинга (с приведением
 * типов и дефолтами) складывается в req.validated[part], т.к. в Express 5
 * req.query доступен только для чтения.
 */
export function validate(part: RequestPart, schema: ZodType): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(new ValidationError('Ошибка валидации данных', z.treeifyError(result.error)));
      return;
    }
    req.validated = { ...req.validated, [part]: result.data };
    next();
  };
}

export function getValidated<T>(req: Request, part: RequestPart): T {
  return req.validated?.[part] as T;
}
