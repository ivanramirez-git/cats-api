import { Request, Response, NextFunction } from 'express';
import { UserController } from '../../../../src/infrastructure/controllers/UserController';
import { RegisterUser } from '../../../../src/application/use-cases/users/RegisterUser';
import { LoginUser } from '../../../../src/application/use-cases/users/LoginUser';
import { UserRole } from '../../../../src/domain/entities/User';

// Mock the use cases
jest.mock('../../../../src/application/use-cases/users/RegisterUser');
jest.mock('../../../../src/application/use-cases/users/LoginUser');

describe('UserController', () => {
  let userController: UserController;
  let mockRegisterUserUseCase: jest.Mocked<RegisterUser>;
  let mockLoginUserUseCase: jest.Mocked<LoginUser>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  const mockUserData = {
    id: '123',
    email: 'test@example.com',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockLoginResult = {
    user: mockUserData,
    token: 'jwt-token-123'
  };

  beforeEach(() => {
    // Create mock use cases
    mockRegisterUserUseCase = {
      execute: jest.fn()
    } as unknown as jest.Mocked<RegisterUser>;

    mockLoginUserUseCase = {
      execute: jest.fn()
    } as unknown as jest.Mocked<LoginUser>;

    // Create controller instance
    userController = new UserController(mockRegisterUserUseCase, mockLoginUserUseCase);

    // Setup mock request and response
    mockRequest = {
      body: {}
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      mockRegisterUserUseCase.execute.mockResolvedValue(mockUserData);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUserData);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle registration with minimal data', async () => {
      // Arrange
      mockRequest.body = { email: 'user@test.com', password: '123' };
      mockRegisterUserUseCase.execute.mockResolvedValue(mockUserData);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: '123'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUserData);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle use case errors by calling next', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      const error = new Error('Email already exists');
      mockRegisterUserUseCase.execute.mockRejectedValue(error);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle missing email in request body', async () => {
      // Arrange
      mockRequest.body = { password: 'password123' };
      mockRegisterUserUseCase.execute.mockResolvedValue(mockUserData);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith({
        email: undefined,
        password: 'password123'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUserData);
    });

    it('should handle missing password in request body', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com' };
      mockRegisterUserUseCase.execute.mockResolvedValue(mockUserData);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: undefined
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUserData);
    });

    it('should handle empty request body', async () => {
      // Arrange
      mockRequest.body = {};
      mockRegisterUserUseCase.execute.mockResolvedValue(mockUserData);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith({
        email: undefined,
        password: undefined
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUserData);
    });

    it('should handle validation errors', async () => {
      // Arrange
      mockRequest.body = { email: 'invalid-email', password: '123' };
      const validationError = new Error('Invalid email format');
      validationError.name = 'ValidationError';
      mockRegisterUserUseCase.execute.mockRejectedValue(validationError);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(validationError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      mockRegisterUserUseCase.execute.mockRejectedValue(timeoutError);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(timeoutError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle null response from use case', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      mockRegisterUserUseCase.execute.mockResolvedValue(null as any);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(null);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle undefined response from use case', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      mockRegisterUserUseCase.execute.mockResolvedValue(undefined as any);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(undefined);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      mockLoginUserUseCase.execute.mockResolvedValue(mockLoginResult);

      // Act
      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockLoginResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle login with different credentials', async () => {
      // Arrange
      mockRequest.body = { email: 'user@test.com', password: 'mypassword' };
      const customLoginResult = {
        user: { id: '456', email: 'user@test.com', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() },
        token: 'different-token'
      };
      mockLoginUserUseCase.execute.mockResolvedValue(customLoginResult);

      // Act
      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'mypassword'
      });
      expect(mockResponse.json).toHaveBeenCalledWith(customLoginResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle authentication errors by calling next', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com', password: 'wrongpassword' };
      const authError = new Error('Invalid credentials');
      mockLoginUserUseCase.execute.mockRejectedValue(authError);

      // Act
      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      expect(mockNext).toHaveBeenCalledWith(authError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle missing email in login request', async () => {
      // Arrange
      mockRequest.body = { password: 'password123' };
      mockLoginUserUseCase.execute.mockResolvedValue(mockLoginResult);

      // Act
      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith({
        email: undefined,
        password: 'password123'
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockLoginResult);
    });

    it('should handle missing password in login request', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com' };
      mockLoginUserUseCase.execute.mockResolvedValue(mockLoginResult);

      // Act
      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: undefined
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockLoginResult);
    });

    it('should handle empty login request body', async () => {
      // Arrange
      mockRequest.body = {};
      mockLoginUserUseCase.execute.mockResolvedValue(mockLoginResult);

      // Act
      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith({
        email: undefined,
        password: undefined
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockLoginResult);
    });

    it('should handle user not found errors', async () => {
      // Arrange
      mockRequest.body = { email: 'nonexistent@example.com', password: 'password123' };
      const notFoundError = new Error('User not found');
      notFoundError.name = 'NotFoundError';
      mockLoginUserUseCase.execute.mockRejectedValue(notFoundError);

      // Act
      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle database connection errors', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      const dbError = new Error('Database connection failed');
      dbError.name = 'DatabaseError';
      mockLoginUserUseCase.execute.mockRejectedValue(dbError);

      // Act
      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle null response from login use case', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      mockLoginUserUseCase.execute.mockResolvedValue(null as any);

      // Act
      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(null);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle undefined response from login use case', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      mockLoginUserUseCase.execute.mockResolvedValue(undefined as any);

      // Act
      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(undefined);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle multiple concurrent register requests', async () => {
      // Arrange
      const request1 = { body: { email: 'user1@test.com', password: 'pass1' } } as unknown as Request;
      const request2 = { body: { email: 'user2@test.com', password: 'pass2' } } as unknown as Request;
      const response1 = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
      const response2 = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
      const next1 = jest.fn();
      const next2 = jest.fn();

      const user1 = { id: '1', email: 'user1@test.com', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const user2 = { id: '2', email: 'user2@test.com', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };

      mockRegisterUserUseCase.execute
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);

      // Act
      await Promise.all([
        userController.register(request1, response1, next1),
        userController.register(request2, response2, next2)
      ]);

      // Assert
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledTimes(2);
      expect(response1.status).toHaveBeenCalledWith(201);
      expect(response1.json).toHaveBeenCalledWith(user1);
      expect(response2.status).toHaveBeenCalledWith(201);
      expect(response2.json).toHaveBeenCalledWith(user2);
    });

    it('should handle multiple concurrent login requests', async () => {
      // Arrange
      const request1 = { body: { email: 'user1@test.com', password: 'pass1' } } as unknown as Request;
      const request2 = { body: { email: 'user2@test.com', password: 'pass2' } } as unknown as Request;
      const response1 = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
      const response2 = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
      const next1 = jest.fn();
      const next2 = jest.fn();

      const loginResult1 = { user: { id: '1', email: 'user1@test.com', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() }, token: 'token1' };
      const loginResult2 = { user: { id: '2', email: 'user2@test.com', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() }, token: 'token2' };

      mockLoginUserUseCase.execute
        .mockResolvedValueOnce(loginResult1)
        .mockResolvedValueOnce(loginResult2);

      // Act
      await Promise.all([
        userController.login(request1, response1, next1),
        userController.login(request2, response2, next2)
      ]);

      // Assert
      expect(mockLoginUserUseCase.execute).toHaveBeenCalledTimes(2);
      expect(response1.json).toHaveBeenCalledWith(loginResult1);
      expect(response2.json).toHaveBeenCalledWith(loginResult2);
    });

    it('should handle mixed success and error scenarios', async () => {
      // Arrange
      const successRequest = { body: { email: 'success@test.com', password: 'validpass' } } as unknown as Request;
      const errorRequest = { body: { email: 'error@test.com', password: 'invalidpass' } } as unknown as Request;
      const successResponse = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
      const errorResponse = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
      const successNext = jest.fn();
      const errorNext = jest.fn();
      const error = new Error('Registration failed');

      mockRegisterUserUseCase.execute
        .mockResolvedValueOnce(mockUserData)
        .mockRejectedValueOnce(error);

      // Act
      await Promise.all([
        userController.register(successRequest, successResponse, successNext),
        userController.register(errorRequest, errorResponse, errorNext)
      ]);

      // Assert
      expect(successResponse.status).toHaveBeenCalledWith(201);
      expect(successResponse.json).toHaveBeenCalledWith(mockUserData);
      expect(successNext).not.toHaveBeenCalled();
      expect(errorNext).toHaveBeenCalledWith(error);
      expect(errorResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed request objects', async () => {
      // Arrange
      const malformedRequest = {} as Request; // No body property

      // Act
      await userController.register(
        malformedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(TypeError));
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle response object errors in register', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      mockRegisterUserUseCase.execute.mockResolvedValue(mockUserData);
      const responseError = new Error('Response error');
      (mockResponse.status as jest.Mock).mockImplementation(() => {
        throw responseError;
      });

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(responseError);
    });

    it('should handle response object errors in login', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      mockLoginUserUseCase.execute.mockResolvedValue(mockLoginResult);
      const responseError = new Error('Response error');
      (mockResponse.json as jest.Mock).mockImplementation(() => {
        throw responseError;
      });

      // Act
      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(responseError);
    });
  });
});