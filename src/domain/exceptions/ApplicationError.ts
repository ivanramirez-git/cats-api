export abstract class ApplicationError extends Error {
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class ValidationError extends ApplicationError {
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(message: string) {
    super(message);
  }
}

export class ConflictError extends ApplicationError {
  readonly statusCode = 409;
  readonly isOperational = true;

  constructor(message: string) {
    super(message);
  }
}

export class NotFoundError extends ApplicationError {
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(message: string) {
    super(message);
  }
}

export class UnauthorizedError extends ApplicationError {
  readonly statusCode = 401;
  readonly isOperational = true;

  constructor(message: string) {
    super(message);
  }
}

export class ForbiddenError extends ApplicationError {
  readonly statusCode = 403;
  readonly isOperational = true;

  constructor(message: string) {
    super(message);
  }
}

export class InternalServerError extends ApplicationError {
  readonly statusCode = 500;
  readonly isOperational = false;

  constructor(message: string = 'Error interno del servidor') {
    super(message);
  }
}