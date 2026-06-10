import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError, NotFoundError } from '../errors/app-error.js';
import { logger } from '../logger/logger.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Маршрут ${req.method} ${req.path} не найден`));
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = res.getHeader('X-Request-Id');

  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      ...(err.details !== undefined ? { details: err.details } : {}),
      requestId,
    });
    return;
  }

  (req.log ?? logger).error({ err }, 'Unhandled error');
  res.status(500).json({
    message: 'Внутренняя ошибка сервера',
    code: 'INTERNAL_ERROR',
    requestId,
  });
};
