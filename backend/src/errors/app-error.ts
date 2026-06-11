export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational: boolean;
  readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    options: { details?: unknown; cause?: unknown; isOperational?: boolean } = {},
  ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = options.isOperational ?? true;
    if (options.details !== undefined) {
      this.details = options.details;
    }
    Error.captureStackTrace(this, new.target);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Некорректный запрос', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', { details });
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Ошибка валидации данных', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', { details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Не авторизован', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', { details });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Доступ запрещён', details?: unknown) {
    super(message, 403, 'FORBIDDEN', { details });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ресурс не найден', details?: unknown) {
    super(message, 404, 'NOT_FOUND', { details });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Конфликт данных', details?: unknown) {
    super(message, 409, 'CONFLICT', { details });
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Слишком много запросов', details?: unknown) {
    super(message, 429, 'TOO_MANY_REQUESTS', { details });
  }
}

export class InternalError extends AppError {
  constructor(message = 'Внутренняя ошибка сервера', cause?: unknown) {
    super(message, 500, 'INTERNAL_ERROR', { cause, isOperational: false });
  }
}
