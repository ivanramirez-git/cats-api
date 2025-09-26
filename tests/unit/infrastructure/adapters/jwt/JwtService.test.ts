import jwt from 'jsonwebtoken';
import { JwtService, JwtPayload } from '../../../../../src/infrastructure/adapters/jwt/JwtService';
import { IUserRepository } from '../../../../../src/domain/repositories/IUserRepository';
import { User, UserRole } from '../../../../../src/domain/entities/User';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Mock config
jest.mock('../../../../../src/config/config', () => ({
  appConfig: {
    jwtSecret: 'test-secret',
    jwtExpiresIn: '1h'
  }
}));

describe('JwtService', () => {
  let jwtService: JwtService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockPayload: JwtPayload = {
    userId: 'user123',
    email: 'test@example.com',
    role: UserRole.USER
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock user repository
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn()
    };
    
    jwtService = new JwtService(mockUserRepository);
  });

  describe('generateToken', () => {
    it('should generate token with correct payload and options', () => {
      const expectedToken = 'generated.jwt.token';
      mockedJwt.sign = jest.fn().mockReturnValue(expectedToken);

      const result = jwtService.generateToken(mockPayload);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        {
          userId: 'user123',
          email: 'test@example.com',
          role: UserRole.USER
        },
        'test-secret',
        {
          expiresIn: '1h'
        }
      );
      expect(result).toBe(expectedToken);
    });

    it('should generate token for admin user', () => {
      const adminPayload: JwtPayload = {
        userId: 'admin123',
        email: 'admin@example.com',
        role: UserRole.ADMIN
      };
      const expectedToken = 'admin.jwt.token';
      mockedJwt.sign = jest.fn().mockReturnValue(expectedToken);

      const result = jwtService.generateToken(adminPayload);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        {
          userId: 'admin123',
          email: 'admin@example.com',
          role: UserRole.ADMIN
        },
        'test-secret',
        {
          expiresIn: '1h'
        }
      );
      expect(result).toBe(expectedToken);
    });

    it('should handle different payload values', () => {
      const customPayload: JwtPayload = {
        userId: 'custom-user-id-123',
        email: 'custom.email+test@domain.co.uk',
        role: UserRole.USER
      };
      const expectedToken = 'custom.jwt.token';
      mockedJwt.sign = jest.fn().mockReturnValue(expectedToken);

      const result = jwtService.generateToken(customPayload);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        {
          userId: 'custom-user-id-123',
          email: 'custom.email+test@domain.co.uk',
          role: UserRole.USER
        },
        'test-secret',
        {
          expiresIn: '1h'
        }
      );
      expect(result).toBe(expectedToken);
    });
  });

  describe('verifyToken', () => {
    const validToken = 'valid.jwt.token';

    it('should verify valid token and return payload', async () => {
      mockedJwt.verify = jest.fn().mockReturnValue(mockPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await jwtService.verifyToken(validToken);

      expect(mockedJwt.verify).toHaveBeenCalledWith(validToken, 'test-secret');
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockPayload);
    });

    it('should throw error when user not found in database', async () => {
      mockedJwt.verify = jest.fn().mockReturnValue(mockPayload);
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(jwtService.verifyToken(validToken)).rejects.toThrow('Usuario no encontrado');
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user123');
    });

    it('should throw error when email in token does not match user email', async () => {
      const userWithDifferentEmail = {
        ...mockUser,
        email: 'different@example.com'
      };
      mockedJwt.verify = jest.fn().mockReturnValue(mockPayload);
      mockUserRepository.findById.mockResolvedValue(userWithDifferentEmail);

      await expect(jwtService.verifyToken(validToken)).rejects.toThrow('Token inválido - datos inconsistentes');
    });

    it('should throw error for expired token', async () => {
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      mockedJwt.verify = jest.fn().mockImplementation(() => {
        throw expiredError;
      });

      await expect(jwtService.verifyToken(validToken)).rejects.toThrow('Token expirado');
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error for invalid token format', async () => {
      const invalidError = new Error('Invalid token');
      invalidError.name = 'JsonWebTokenError';
      mockedJwt.verify = jest.fn().mockImplementation(() => {
        throw invalidError;
      });

      await expect(jwtService.verifyToken(validToken)).rejects.toThrow('Token inválido');
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw generic error for other JWT errors', async () => {
      const genericError = new Error('Some other JWT error');
      genericError.name = 'SomeOtherError';
      mockedJwt.verify = jest.fn().mockImplementation(() => {
        throw genericError;
      });

      await expect(jwtService.verifyToken(validToken)).rejects.toThrow('Error al verificar token');
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should re-throw user not found error', async () => {
      mockedJwt.verify = jest.fn().mockReturnValue(mockPayload);
      mockUserRepository.findById.mockRejectedValue(new Error('Usuario no encontrado'));

      await expect(jwtService.verifyToken(validToken)).rejects.toThrow('Usuario no encontrado');
    });

    it('should re-throw token inconsistent data error', async () => {
      mockedJwt.verify = jest.fn().mockReturnValue(mockPayload);
      mockUserRepository.findById.mockRejectedValue(new Error('Token inválido - datos inconsistentes'));

      await expect(jwtService.verifyToken(validToken)).rejects.toThrow('Token inválido - datos inconsistentes');
    });

    it('should handle database errors during user lookup', async () => {
      mockedJwt.verify = jest.fn().mockReturnValue(mockPayload);
      mockUserRepository.findById.mockRejectedValue(new Error('Database connection error'));

      await expect(jwtService.verifyToken(validToken)).rejects.toThrow('Error al verificar token');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete token lifecycle', async () => {
      // Generate token
      const expectedToken = 'lifecycle.jwt.token';
      mockedJwt.sign = jest.fn().mockReturnValue(expectedToken);
      
      const generatedToken = jwtService.generateToken(mockPayload);
      expect(generatedToken).toBe(expectedToken);

      // Verify token
      mockedJwt.verify = jest.fn().mockReturnValue(mockPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      
      const verifiedPayload = await jwtService.verifyToken(generatedToken);
      expect(verifiedPayload).toEqual(mockPayload);
    });

    it('should handle admin user token lifecycle', async () => {
      const adminPayload: JwtPayload = {
        userId: 'admin123',
        email: 'admin@example.com',
        role: UserRole.ADMIN
      };
      const adminUser: User = {
        ...mockUser,
        id: 'admin123',
        email: 'admin@example.com',
        role: UserRole.ADMIN
      };

      // Generate admin token
      const expectedToken = 'admin.lifecycle.token';
      mockedJwt.sign = jest.fn().mockReturnValue(expectedToken);
      
      const generatedToken = jwtService.generateToken(adminPayload);
      expect(generatedToken).toBe(expectedToken);

      // Verify admin token
      mockedJwt.verify = jest.fn().mockReturnValue(adminPayload);
      mockUserRepository.findById.mockResolvedValue(adminUser);
      
      const verifiedPayload = await jwtService.verifyToken(generatedToken);
      expect(verifiedPayload).toEqual(adminPayload);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle very long user IDs', () => {
      const longUserIdPayload: JwtPayload = {
        userId: 'a'.repeat(100),
        email: 'test@example.com',
        role: UserRole.USER
      };
      const expectedToken = 'long.user.id.token';
      mockedJwt.sign = jest.fn().mockReturnValue(expectedToken);

      const result = jwtService.generateToken(longUserIdPayload);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'a'.repeat(100)
        }),
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(result).toBe(expectedToken);
    });

    it('should handle special characters in email', () => {
      const specialEmailPayload: JwtPayload = {
        userId: 'user123',
        email: 'test+special.chars@sub-domain.co.uk',
        role: UserRole.USER
      };
      const expectedToken = 'special.email.token';
      mockedJwt.sign = jest.fn().mockReturnValue(expectedToken);

      const result = jwtService.generateToken(specialEmailPayload);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test+special.chars@sub-domain.co.uk'
        }),
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(result).toBe(expectedToken);
    });

    it('should handle empty token string', async () => {
      const emptyTokenError = new Error('jwt must be provided');
      emptyTokenError.name = 'JsonWebTokenError';
      mockedJwt.verify = jest.fn().mockImplementation(() => {
        throw emptyTokenError;
      });

      await expect(jwtService.verifyToken('')).rejects.toThrow('Token inválido');
    });

    it('should handle malformed token', async () => {
      const malformedError = new Error('jwt malformed');
      malformedError.name = 'JsonWebTokenError';
      mockedJwt.verify = jest.fn().mockImplementation(() => {
        throw malformedError;
      });

      await expect(jwtService.verifyToken('malformed.token')).rejects.toThrow('Token inválido');
    });
  });
});