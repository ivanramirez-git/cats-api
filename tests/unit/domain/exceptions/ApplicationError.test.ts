import {
  ApplicationError,
  ValidationError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  InternalServerError
} from '../../../../src/domain/exceptions/ApplicationError';

// Concrete implementation of ApplicationError for testing
class TestApplicationError extends ApplicationError {
  readonly statusCode = 500;
  readonly isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'TestApplicationError';
  }
}

describe('ApplicationError', () => {
  describe('Base ApplicationError class', () => {
    it('should create an error with message', () => {
      const message = 'Test error message';
      const error = new TestApplicationError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('TestApplicationError');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should be instance of Error', () => {
      const error = new TestApplicationError('Test message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
    });

    it('should have stack trace', () => {
      const error = new TestApplicationError('Test message');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('should maintain prototype chain', () => {
      const error = new TestApplicationError('Test message');

      expect(Object.getPrototypeOf(error)).toBe(TestApplicationError.prototype);
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with correct properties', () => {
      const message = 'Validation failed';
      const error = new ValidationError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('ValidationError');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should be instance of ApplicationError and Error', () => {
      const error = new ValidationError('Test message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('should have stack trace', () => {
      const error = new ValidationError('Test message');

      expect(error.stack).toBeDefined();
    });

    it('should handle empty message', () => {
      const error = new ValidationError('');

      expect(error.message).toBe('');
      expect(error.name).toBe('ValidationError');
    });

    it('should handle special characters in message', () => {
      const message = 'Error with special chars: áéíóú ñ @#$%';
      const error = new ValidationError(message);

      expect(error.message).toBe(message);
    });
  });

  describe('ConflictError', () => {
    it('should create ConflictError with correct properties', () => {
      const message = 'Resource conflict';
      const error = new ConflictError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('ConflictError');
      expect(error.statusCode).toBe(409);
      expect(error.isOperational).toBe(true);
    });

    it('should be instance of ApplicationError and Error', () => {
      const error = new ConflictError('Test message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toBeInstanceOf(ConflictError);
    });

    it('should have stack trace', () => {
      const error = new ConflictError('Test message');

      expect(error.stack).toBeDefined();
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with correct properties', () => {
      const message = 'Resource not found';
      const error = new NotFoundError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('NotFoundError');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should be instance of ApplicationError and Error', () => {
      const error = new NotFoundError('Test message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should have stack trace', () => {
      const error = new NotFoundError('Test message');

      expect(error.stack).toBeDefined();
    });
  });

  describe('UnauthorizedError', () => {
    it('should create UnauthorizedError with correct properties', () => {
      const message = 'Unauthorized access';
      const error = new UnauthorizedError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('UnauthorizedError');
      expect(error.statusCode).toBe(401);
      expect(error.isOperational).toBe(true);
    });

    it('should be instance of ApplicationError and Error', () => {
      const error = new UnauthorizedError('Test message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should have stack trace', () => {
      const error = new UnauthorizedError('Test message');

      expect(error.stack).toBeDefined();
    });
  });

  describe('ForbiddenError', () => {
    it('should create ForbiddenError with correct properties', () => {
      const message = 'Access forbidden';
      const error = new ForbiddenError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('ForbiddenError');
      expect(error.statusCode).toBe(403);
      expect(error.isOperational).toBe(true);
    });

    it('should be instance of ApplicationError and Error', () => {
      const error = new ForbiddenError('Test message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toBeInstanceOf(ForbiddenError);
    });

    it('should have stack trace', () => {
      const error = new ForbiddenError('Test message');

      expect(error.stack).toBeDefined();
    });
  });

  describe('InternalServerError', () => {
    it('should create InternalServerError with custom message', () => {
      const message = 'Custom server error';
      const error = new InternalServerError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('InternalServerError');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });

    it('should create InternalServerError with default message', () => {
      const error = new InternalServerError();

      expect(error.message).toBe('Error interno del servidor');
      expect(error.name).toBe('InternalServerError');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });

    it('should be instance of ApplicationError and Error', () => {
      const error = new InternalServerError('Test message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toBeInstanceOf(InternalServerError);
    });

    it('should have stack trace', () => {
      const error = new InternalServerError('Test message');

      expect(error.stack).toBeDefined();
    });

    it('should have isOperational as false', () => {
      const error = new InternalServerError('Test message');

      expect(error.isOperational).toBe(false);
    });
  });

  describe('Error inheritance and polymorphism', () => {
    it('should allow polymorphic usage', () => {
      const errors: ApplicationError[] = [
        new ValidationError('Validation error'),
        new ConflictError('Conflict error'),
        new NotFoundError('Not found error'),
        new UnauthorizedError('Unauthorized error'),
        new ForbiddenError('Forbidden error'),
        new InternalServerError('Server error')
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toBeInstanceOf(Error);
        expect(typeof error.statusCode).toBe('number');
        expect(typeof error.isOperational).toBe('boolean');
        expect(typeof error.message).toBe('string');
        expect(typeof error.name).toBe('string');
      });
    });

    it('should have correct status codes', () => {
      expect(new ValidationError('test').statusCode).toBe(400);
      expect(new UnauthorizedError('test').statusCode).toBe(401);
      expect(new ForbiddenError('test').statusCode).toBe(403);
      expect(new NotFoundError('test').statusCode).toBe(404);
      expect(new ConflictError('test').statusCode).toBe(409);
      expect(new InternalServerError('test').statusCode).toBe(500);
    });

    it('should have correct operational flags', () => {
      expect(new ValidationError('test').isOperational).toBe(true);
      expect(new UnauthorizedError('test').isOperational).toBe(true);
      expect(new ForbiddenError('test').isOperational).toBe(true);
      expect(new NotFoundError('test').isOperational).toBe(true);
      expect(new ConflictError('test').isOperational).toBe(true);
      expect(new InternalServerError('test').isOperational).toBe(false);
    });

    it('should have correct error names', () => {
      expect(new ValidationError('test').name).toBe('ValidationError');
      expect(new UnauthorizedError('test').name).toBe('UnauthorizedError');
      expect(new ForbiddenError('test').name).toBe('ForbiddenError');
      expect(new NotFoundError('test').name).toBe('NotFoundError');
      expect(new ConflictError('test').name).toBe('ConflictError');
      expect(new InternalServerError('test').name).toBe('InternalServerError');
    });
  });

  describe('Error throwing and catching', () => {
    it('should be throwable and catchable', () => {
      const throwValidationError = () => {
        throw new ValidationError('Test validation error');
      };

      expect(throwValidationError).toThrow(ValidationError);
      expect(throwValidationError).toThrow(Error);
      expect(throwValidationError).toThrow('Test validation error');
    });

    it('should be throwable and catchable as ApplicationError', () => {
      const throwValidationError = () => {
        throw new ValidationError('Test validation error');
      };

      expect(throwValidationError).toThrow(ValidationError);
      expect(throwValidationError).toThrow('Test validation error');

      try {
        throwValidationError();
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should maintain error properties when caught', () => {
      try {
        throw new ConflictError('Test conflict');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictError);
        expect((error as ConflictError).statusCode).toBe(409);
        expect((error as ConflictError).isOperational).toBe(true);
        expect((error as ConflictError).message).toBe('Test conflict');
      }
    });

    it('should be distinguishable by instanceof', () => {
      const validationError = new ValidationError('test');
      const conflictError = new ConflictError('test');
      const notFoundError = new NotFoundError('test');

      expect(validationError instanceof ValidationError).toBe(true);
      expect(validationError instanceof ConflictError).toBe(false);
      expect(validationError instanceof NotFoundError).toBe(false);

      expect(conflictError instanceof ConflictError).toBe(true);
      expect(conflictError instanceof ValidationError).toBe(false);
      expect(conflictError instanceof NotFoundError).toBe(false);

      expect(notFoundError instanceof NotFoundError).toBe(true);
      expect(notFoundError instanceof ValidationError).toBe(false);
      expect(notFoundError instanceof ConflictError).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new ValidationError(longMessage);

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(1000);
    });

    it('should handle unicode characters in messages', () => {
      const unicodeMessage = '🚫 Error with emojis and unicode: 中文 العربية';
      const error = new ValidationError(unicodeMessage);

      expect(error.message).toBe(unicodeMessage);
    });

    it('should handle newlines and special characters', () => {
      const messageWithNewlines = 'Error\nwith\nnewlines\tand\ttabs';
      const error = new ValidationError(messageWithNewlines);

      expect(error.message).toBe(messageWithNewlines);
    });

    it('should handle null-like strings', () => {
      const nullString = 'null';
      const undefinedString = 'undefined';
      
      const error1 = new ValidationError(nullString);
      const error2 = new ValidationError(undefinedString);

      expect(error1.message).toBe('null');
      expect(error2.message).toBe('undefined');
    });
  });
});