import { Request, Response, NextFunction } from 'express';
import { ApplicationError } from '../../domain/exceptions/ApplicationError';

export interface AppError extends Error {
  statusCode?: number;
}

export class ErrorMiddleware {
  static handle = (error: Error | ApplicationError, req: Request, res: Response, next: NextFunction): void => {
    let statusCode = 500;
    let message = 'Error interno del servidor';
    let isOperational = false;

    // Si es un error de aplicación personalizado
    if (error instanceof ApplicationError) {
      statusCode = error.statusCode;
      message = error.message;
      isOperational = error.isOperational;
    } 
    // Si es un error legacy con statusCode
    else if ('statusCode' in error && typeof error.statusCode === 'number') {
      statusCode = error.statusCode;
      message = error.message;
    }
    // Error genérico
    else {
      message = error.message || message;
    }

    // Solo loguear errores no operacionales o errores 500
    if (!isOperational || statusCode >= 500) {
      console.error(`Error ${statusCode}: ${message}`);
      console.error(error.stack);
    } else {
      // Para errores operacionales (400, 401, 409, etc.) solo log básico
      console.log(`Client error ${statusCode}: ${message}`);
    }

    res.status(statusCode).json({
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  };
}