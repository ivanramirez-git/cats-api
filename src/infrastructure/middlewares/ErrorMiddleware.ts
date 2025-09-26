import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
}

export class ErrorMiddleware {
  static handle = (error: AppError, req: Request, res: Response, next: NextFunction): void => {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Error interno del servidor';

    console.error(`Error ${statusCode}: ${message}`);
    console.error(error.stack);

    res.status(statusCode).json({
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  };
}