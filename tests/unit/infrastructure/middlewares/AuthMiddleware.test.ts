import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware, AuthenticatedRequest } from '../../../../src/infrastructure/middlewares/AuthMiddleware';
import { JwtService } from '../../../../src/infrastructure/adapters/jwt/JwtService';
import { UserRole } from '../../../../src/domain/entities/User';

// Mock the JwtService
jest.mock('../../../../src/infrastructure/adapters/jwt/JwtService');

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  const mockUserPayload = {
    userId: '123',
    email: 'test@example.com',
    role: UserRole.USER
  };

  const mockAdminPayload = {
    userId: '456',
    email: 'admin@example.com',
    role: UserRole.ADMIN
  };

  beforeEach(() => {
    // Create mock JwtService
    mockJwtService = {
      verifyToken: jest.fn(),
      generateToken: jest.fn()
    } as unknown as jest.Mocked<JwtService>;

    // Create middleware instance
    authMiddleware = new AuthMiddleware(mockJwtService);

    // Setup mock request and response
    mockRequest = {
      headers: {}
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid token', async () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockJwtService.verifyToken.mockResolvedValue(mockUserPayload);

      // Act
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockUserPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should authenticate admin user with valid token', async () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer admin-token' };
      mockJwtService.verifyToken.mockResolvedValue(mockAdminPayload);

      // Act
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith('admin-token');
      expect(mockRequest.user).toEqual(mockAdminPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockJwtService.verifyToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token de acceso requerido' });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should reject request with empty authorization header', async () => {
      // Arrange
      mockRequest.headers = { authorization: '' };

      // Act
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockJwtService.verifyToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token de acceso requerido' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request without Bearer prefix', async () => {
      // Arrange
      mockRequest.headers = { authorization: 'invalid-token' };

      // Act
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockJwtService.verifyToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token de acceso requerido' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with malformed Bearer token', async () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer' };

      // Act
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockJwtService.verifyToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token de acceso requerido' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle expired token error', async () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer expired-token' };
      const expiredError = new Error('Token expirado');
      mockJwtService.verifyToken.mockRejectedValue(expiredError);

      // Act
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith('expired-token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token expirado' });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should handle user not found error', async () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer user-not-found-token' };
      const notFoundError = new Error('Usuario no encontrado');
      mockJwtService.verifyToken.mockRejectedValue(notFoundError);

      // Act
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith('user-not-found-token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Usuario no encontrado' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle invalid token data error', async () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer invalid-data-token' };
      const invalidDataError = new Error('Token inválido - datos inconsistentes');
      mockJwtService.verifyToken.mockRejectedValue(invalidDataError);

      // Act
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith('invalid-data-token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token inválido' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle generic token verification error', async () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer generic-error-token' };
      const genericError = new Error('Some generic error');
      mockJwtService.verifyToken.mockRejectedValue(genericError);

      // Act
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith('generic-error-token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token inválido' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with extra spaces', async () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer   token-with-spaces   ' };
      mockJwtService.verifyToken.mockResolvedValue(mockUserPayload);

      // Act
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith('  token-with-spaces   ');
      expect(mockRequest.user).toEqual(mockUserPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle case-sensitive Bearer prefix', async () => {
      // Arrange
      mockRequest.headers = { authorization: 'bearer valid-token' };

      // Act
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockJwtService.verifyToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token de acceso requerido' });
    });

    it('should handle null authorization header', async () => {
      // Arrange
      mockRequest.headers = { authorization: null as any };

      // Act
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockJwtService.verifyToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token de acceso requerido' });
    });
  });

  describe('authorize', () => {
    it('should authorize user with correct role', () => {
      // Arrange
      mockRequest.user = mockUserPayload;
      const authorizeMiddleware = authMiddleware.authorize([UserRole.USER]);

      // Act
      authorizeMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should authorize admin user with admin role', () => {
      // Arrange
      mockRequest.user = mockAdminPayload;
      const authorizeMiddleware = authMiddleware.authorize([UserRole.ADMIN]);

      // Act
      authorizeMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should authorize user with multiple allowed roles', () => {
      // Arrange
      mockRequest.user = mockUserPayload;
      const authorizeMiddleware = authMiddleware.authorize([UserRole.USER, UserRole.ADMIN]);

      // Act
      authorizeMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should authorize admin with multiple allowed roles', () => {
      // Arrange
      mockRequest.user = mockAdminPayload;
      const authorizeMiddleware = authMiddleware.authorize([UserRole.USER, UserRole.ADMIN]);

      // Act
      authorizeMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated user', () => {
      // Arrange
      mockRequest.user = undefined;
      const authorizeMiddleware = authMiddleware.authorize([UserRole.USER]);

      // Act
      authorizeMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Usuario no autenticado' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject user with insufficient role', () => {
      // Arrange
      mockRequest.user = mockUserPayload;
      const authorizeMiddleware = authMiddleware.authorize([UserRole.ADMIN]);

      // Act
      authorizeMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Acceso denegado' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject admin trying to access user-only resource', () => {
      // Arrange
      mockRequest.user = mockAdminPayload;
      const authorizeMiddleware = authMiddleware.authorize([UserRole.USER]);

      // Act
      authorizeMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Acceso denegado' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject when no roles are allowed', () => {
      // Arrange
      mockRequest.user = mockUserPayload;
      const authorizeMiddleware = authMiddleware.authorize([]);

      // Act
      authorizeMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Acceso denegado' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle null user object', () => {
      // Arrange
      mockRequest.user = null as any;
      const authorizeMiddleware = authMiddleware.authorize([UserRole.USER]);

      // Act
      authorizeMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Usuario no autenticado' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle authentication followed by authorization', async () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockJwtService.verifyToken.mockResolvedValue(mockUserPayload);
      const authorizeMiddleware = authMiddleware.authorize([UserRole.USER]);

      // Act - First authenticate
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Reset mocks for authorization step
      jest.clearAllMocks();

      // Act - Then authorize
      authorizeMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle authentication failure before authorization', async () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      const authError = new Error('Token inválido');
      mockJwtService.verifyToken.mockRejectedValue(authError);
      const authorizeMiddleware = authMiddleware.authorize([UserRole.USER]);

      // Act - First authenticate (should fail)
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Reset mocks for authorization step
      jest.clearAllMocks();

      // Act - Then try to authorize (should fail due to no user)
      authorizeMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Usuario no autenticado' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle multiple concurrent authentication requests', async () => {
      // Arrange
      const request1 = { headers: { authorization: 'Bearer token1' } } as AuthenticatedRequest;
      const request2 = { headers: { authorization: 'Bearer token2' } } as AuthenticatedRequest;
      const response1 = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
      const response2 = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
      const next1 = jest.fn();
      const next2 = jest.fn();

      const payload1 = { userId: '1', email: 'user1@test.com', role: UserRole.USER };
      const payload2 = { userId: '2', email: 'user2@test.com', role: UserRole.ADMIN };

      mockJwtService.verifyToken
        .mockResolvedValueOnce(payload1)
        .mockResolvedValueOnce(payload2);

      // Act
      await Promise.all([
        authMiddleware.authenticate(request1, response1, next1),
        authMiddleware.authenticate(request2, response2, next2)
      ]);

      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledTimes(2);
      expect(request1.user).toEqual(payload1);
      expect(request2.user).toEqual(payload2);
      expect(next1).toHaveBeenCalled();
      expect(next2).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed request objects in authenticate', async () => {
      // Arrange
      const malformedRequest = {} as AuthenticatedRequest; // No headers property

      // Act
      await authMiddleware.authenticate(
        malformedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token inválido' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle response object errors in authenticate', async () => {
      // Arrange
      mockRequest.headers = {};
      const responseError = new Error('Response error');
      (mockResponse.status as jest.Mock).mockImplementation(() => {
        throw responseError;
      });

      // Act & Assert
      await expect(authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )).rejects.toThrow('Response error');
    });

    it('should handle response object errors in authorize', () => {
      // Arrange
      mockRequest.user = undefined;
      const authorizeMiddleware = authMiddleware.authorize([UserRole.USER]);
      const responseError = new Error('Response error');
      (mockResponse.status as jest.Mock).mockImplementation(() => {
        throw responseError;
      });

      // Act & Assert
      expect(() => {
        authorizeMiddleware(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          mockNext
        );
      }).toThrow('Response error');
    });

    it('should handle very long tokens', async () => {
      // Arrange
      const longToken = 'a'.repeat(1000);
      mockRequest.headers = { authorization: `Bearer ${longToken}` };
      mockJwtService.verifyToken.mockResolvedValue(mockUserPayload);

      // Act
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith(longToken);
      expect(mockRequest.user).toEqual(mockUserPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle special characters in tokens', async () => {
      // Arrange
      const specialToken = 'token-with-special-chars!@#$%^&*()_+{}|:<>?[]\\;\',./`~';
      mockRequest.headers = { authorization: `Bearer ${specialToken}` };
      mockJwtService.verifyToken.mockResolvedValue(mockUserPayload);

      // Act
      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith(specialToken);
      expect(mockRequest.user).toEqual(mockUserPayload);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});