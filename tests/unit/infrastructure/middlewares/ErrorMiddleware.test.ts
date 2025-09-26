import { Request, Response, NextFunction } from 'express';
import { ErrorMiddleware, AppError } from '../../../../src/infrastructure/middlewares/ErrorMiddleware';
import { 
  ApplicationError,
  ValidationError,
  NotFoundError,
  ConflictError
} from '../../../../src/domain/exceptions/ApplicationError';

// Concrete implementation of ApplicationError for testing
class TestApplicationError extends ApplicationError {
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = 'TestApplicationError';
  }
}

describe('ErrorMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    // Setup mock request and response
    mockRequest = {
      method: 'GET',
      url: '/test',
      headers: {}
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Setup console spies
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Store original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();

    // Restore NODE_ENV
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('ApplicationError handling', () => {
    it('should handle ValidationError correctly', () => {
      // Arrange
      const error = new ValidationError('Campo requerido');

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Campo requerido'
      });
      expect(consoleSpy).toHaveBeenCalledWith('Client error 400: Campo requerido');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle NotFoundError correctly', () => {
      // Arrange
      const error = new NotFoundError('Recurso no encontrado');

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Recurso no encontrado'
      });
      expect(consoleSpy).toHaveBeenCalledWith('Client error 404: Recurso no encontrado');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle ConflictError correctly', () => {
      // Arrange
      const error = new ConflictError('Email ya existe');

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Email ya existe'
      });
      expect(consoleSpy).toHaveBeenCalledWith('Client error 409: Email ya existe');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle custom ApplicationError with 500 status', () => {
      // Arrange
      const error = new TestApplicationError('Error interno', 500, false);

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error interno'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error 500: Error interno');
      expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack);
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should handle ApplicationError with non-operational flag', () => {
      // Arrange
      const error = new TestApplicationError('Error crítico', 400, false);

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error crítico'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error 400: Error crítico');
      expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack);
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('Legacy error handling', () => {
    it('should handle error with statusCode property', () => {
      // Arrange
      const error: AppError = new Error('Error personalizado');
      error.statusCode = 422;

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error personalizado'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error 422: Error personalizado');
      expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack);
    });

    it('should handle error with statusCode 500', () => {
      // Arrange
      const error: AppError = new Error('Error del servidor');
      error.statusCode = 500;

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error del servidor'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error 500: Error del servidor');
      expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack);
    });

    it('should handle error with invalid statusCode type', () => {
      // Arrange
      const error: any = new Error('Error con statusCode inválido');
      error.statusCode = 'invalid';

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error con statusCode inválido'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error 500: Error con statusCode inválido');
    });
  });

  describe('Generic error handling', () => {
    it('should handle generic Error with message', () => {
      // Arrange
      const error = new Error('Error genérico');

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error genérico'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error 500: Error genérico');
      expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack);
    });

    it('should handle generic Error without message', () => {
      // Arrange
      const error = new Error();

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error 500: Error interno del servidor');
    });

    it('should handle error with empty message', () => {
      // Arrange
      const error = new Error('');

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error 500: Error interno del servidor');
    });
  });

  describe('Development environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should include stack trace in development mode', () => {
      // Arrange
      const error = new Error('Error en desarrollo');

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error en desarrollo',
        stack: error.stack
      });
    });

    it('should include stack trace for ApplicationError in development', () => {
      // Arrange
      const error = new ValidationError('Error de validación');

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error de validación',
        stack: error.stack
      });
    });
  });

  describe('Production environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should not include stack trace in production mode', () => {
      // Arrange
      const error = new Error('Error en producción');

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error en producción'
      });
    });

    it('should not include stack trace for ApplicationError in production', () => {
      // Arrange
      const error = new ValidationError('Error de validación');

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error de validación'
      });
    });
  });

  describe('Logging behavior', () => {
    it('should log operational errors with console.log', () => {
      // Arrange
      const error = new ValidationError('Error operacional');

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Client error 400: Error operacional');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should log non-operational errors with console.error', () => {
      // Arrange
      const error = new TestApplicationError('Error no operacional', 400, false);

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error 400: Error no operacional');
      expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack);
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log 500+ errors with console.error even if operational', () => {
      // Arrange
      const error = new TestApplicationError('Error 500 operacional', 500, true);

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error 500: Error 500 operacional');
      expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack);
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log generic errors with console.error', () => {
      // Arrange
      const error = new Error('Error genérico');

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error 500: Error genérico');
      expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack);
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null error', () => {
      // Arrange
      const error = null as any;

      // Act & Assert
      expect(() => {
        ErrorMiddleware.handle(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      }).toThrow();
    });

    it('should handle undefined error', () => {
      // Arrange
      const error = undefined as any;

      // Act & Assert
      expect(() => {
        ErrorMiddleware.handle(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      }).toThrow();
    });

    it('should handle error without stack property', () => {
      // Arrange
      const error: any = {
        message: 'Error sin stack',
        name: 'CustomError'
      };

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error sin stack'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error 500: Error sin stack');
      expect(consoleErrorSpy).toHaveBeenCalledWith(undefined);
    });

    it('should handle response object errors', () => {
      // Arrange
      const error = new Error('Test error');
      const responseError = new Error('Response error');
      (mockResponse.status as jest.Mock).mockImplementation(() => {
        throw responseError;
      });

      // Act & Assert
      expect(() => {
        ErrorMiddleware.handle(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      }).toThrow('Response error');
    });

    it('should handle very long error messages', () => {
      // Arrange
      const longMessage = 'a'.repeat(1000);
      const error = new Error(longMessage);

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: longMessage
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error 500: ${longMessage}`);
    });

    it('should handle error with special characters', () => {
      // Arrange
      const specialMessage = 'Error with special chars: !@#$%^&*()_+{}|:<>?[]\\;\',./`~';
      const error = new Error(specialMessage);

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: specialMessage
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error 500: ${specialMessage}`);
    });

    it('should handle NODE_ENV as undefined', () => {
      // Arrange
      delete process.env.NODE_ENV;
      const error = new Error('Error sin NODE_ENV');

      // Act
      ErrorMiddleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error sin NODE_ENV'
      });
    });
  });
});