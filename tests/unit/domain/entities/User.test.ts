import { User, UserRole, CreateUserRequest, LoginRequest, AuthResponse } from '../../../../src/domain/entities/User';

describe('User Domain Entities', () => {
  describe('User Interface', () => {
    it('should have correct structure for User interface', () => {
      // Arrange
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: UserRole.USER,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z')
      };

      // Assert
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('password');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
      expect(typeof user.id).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(typeof user.password).toBe('string');
      expect(Object.values(UserRole)).toContain(user.role);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should allow different user roles', () => {
      // Arrange & Act
      const adminUser: User = {
        id: 'admin-123',
        email: 'admin@example.com',
        password: 'hashedPassword123',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const regularUser: User = {
        id: 'user-123',
        email: 'user@example.com',
        password: 'hashedPassword123',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Assert
      expect(adminUser.role).toBe(UserRole.ADMIN);
      expect(regularUser.role).toBe(UserRole.USER);
    });

    it('should handle valid email formats', () => {
      // Arrange
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin+tag@company.org',
        'number123@test.io'
      ];

      // Act & Assert
      validEmails.forEach(email => {
        const user: User = {
          id: 'user-123',
          email,
          password: 'password123',
          role: UserRole.USER,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        expect(user.email).toBe(email);
        expect(typeof user.email).toBe('string');
      });
    });

    it('should handle date properties correctly', () => {
      // Arrange
      const now = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER,
        createdAt: yesterday,
        updatedAt: now
      };

      // Assert
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.updatedAt.getTime()).toBeGreaterThan(user.createdAt.getTime());
    });
  });

  describe('UserRole Enum', () => {
    it('should have correct USER role value', () => {
      // Assert
      expect(UserRole.USER).toBe('user');
      expect(typeof UserRole.USER).toBe('string');
    });

    it('should have correct ADMIN role value', () => {
      // Assert
      expect(UserRole.ADMIN).toBe('admin');
      expect(typeof UserRole.ADMIN).toBe('string');
    });

    it('should contain only expected role values', () => {
      // Assert
      const roleValues = Object.values(UserRole);
      expect(roleValues).toHaveLength(2);
      expect(roleValues).toContain('user');
      expect(roleValues).toContain('admin');
    });

    it('should have correct enum keys', () => {
      // Assert
      const roleKeys = Object.keys(UserRole);
      expect(roleKeys).toHaveLength(2);
      expect(roleKeys).toContain('USER');
      expect(roleKeys).toContain('ADMIN');
    });

    it('should allow role comparison', () => {
      // Arrange
      const userRole = UserRole.USER;
      const adminRole = UserRole.ADMIN;

      // Assert
      expect(userRole).not.toBe(adminRole);
      expect(userRole === 'user').toBe(true);
      expect(adminRole === 'admin').toBe(true);
    });
  });

  describe('CreateUserRequest Interface', () => {
    it('should have correct structure with required fields', () => {
      // Arrange
      const createUserRequest: CreateUserRequest = {
        email: 'newuser@example.com',
        password: 'password123'
      };

      // Assert
      expect(createUserRequest).toHaveProperty('email');
      expect(createUserRequest).toHaveProperty('password');
      expect(typeof createUserRequest.email).toBe('string');
      expect(typeof createUserRequest.password).toBe('string');
    });

    it('should allow optional role field', () => {
      // Arrange
      const createUserWithRole: CreateUserRequest = {
        email: 'admin@example.com',
        password: 'password123',
        role: UserRole.ADMIN
      };

      const createUserWithoutRole: CreateUserRequest = {
        email: 'user@example.com',
        password: 'password123'
      };

      // Assert
      expect(createUserWithRole.role).toBe(UserRole.ADMIN);
      expect(createUserWithoutRole.role).toBeUndefined();
    });

    it('should handle different role values', () => {
      // Arrange
      const adminRequest: CreateUserRequest = {
        email: 'admin@example.com',
        password: 'password123',
        role: UserRole.ADMIN
      };

      const userRequest: CreateUserRequest = {
        email: 'user@example.com',
        password: 'password123',
        role: UserRole.USER
      };

      // Assert
      expect(adminRequest.role).toBe('admin');
      expect(userRequest.role).toBe('user');
    });

    it('should validate email and password are strings', () => {
      // Arrange
      const request: CreateUserRequest = {
        email: 'test@example.com',
        password: 'securePassword123!'
      };

      // Assert
      expect(typeof request.email).toBe('string');
      expect(typeof request.password).toBe('string');
      expect(request.email.length).toBeGreaterThan(0);
      expect(request.password.length).toBeGreaterThan(0);
    });
  });

  describe('LoginRequest Interface', () => {
    it('should have correct structure', () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'user@example.com',
        password: 'password123'
      };

      // Assert
      expect(loginRequest).toHaveProperty('email');
      expect(loginRequest).toHaveProperty('password');
      expect(typeof loginRequest.email).toBe('string');
      expect(typeof loginRequest.password).toBe('string');
    });

    it('should handle various email formats', () => {
      // Arrange
      const emailFormats = [
        'simple@example.com',
        'user.name@domain.com',
        'test+tag@company.org',
        'admin@subdomain.example.co.uk'
      ];

      // Act & Assert
      emailFormats.forEach(email => {
        const loginRequest: LoginRequest = {
          email,
          password: 'password123'
        };
        expect(loginRequest.email).toBe(email);
        expect(typeof loginRequest.email).toBe('string');
      });
    });

    it('should handle different password formats', () => {
      // Arrange
      const passwords = [
        'simplepass',
        'Complex123!',
        'very_long_password_with_special_chars@#$',
        '12345678'
      ];

      // Act & Assert
      passwords.forEach(password => {
        const loginRequest: LoginRequest = {
          email: 'test@example.com',
          password
        };
        expect(loginRequest.password).toBe(password);
        expect(typeof loginRequest.password).toBe('string');
      });
    });

    it('should not have additional properties', () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'user@example.com',
        password: 'password123'
      };

      // Assert
      const keys = Object.keys(loginRequest);
      expect(keys).toHaveLength(2);
      expect(keys).toContain('email');
      expect(keys).toContain('password');
    });
  });

  describe('AuthResponse Interface', () => {
    it('should have correct structure', () => {
      // Arrange
      const authResponse: AuthResponse = {
        token: 'jwt.token.here',
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: UserRole.USER,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      // Assert
      expect(authResponse).toHaveProperty('token');
      expect(authResponse).toHaveProperty('user');
      expect(typeof authResponse.token).toBe('string');
      expect(typeof authResponse.user).toBe('object');
    });

    it('should omit password from user object', () => {
      // Arrange
      const authResponse: AuthResponse = {
        token: 'jwt.token.here',
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: UserRole.USER,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      // Assert
      expect(authResponse.user).not.toHaveProperty('password');
      expect(authResponse.user).toHaveProperty('id');
      expect(authResponse.user).toHaveProperty('email');
      expect(authResponse.user).toHaveProperty('role');
      expect(authResponse.user).toHaveProperty('createdAt');
      expect(authResponse.user).toHaveProperty('updatedAt');
    });

    it('should handle different user roles in response', () => {
      // Arrange
      const adminAuthResponse: AuthResponse = {
        token: 'admin.jwt.token',
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const userAuthResponse: AuthResponse = {
        token: 'user.jwt.token',
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: UserRole.USER,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      // Assert
      expect(adminAuthResponse.user.role).toBe(UserRole.ADMIN);
      expect(userAuthResponse.user.role).toBe(UserRole.USER);
    });

    it('should handle JWT token formats', () => {
      // Arrange
      const jwtTokens = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'simple.token.format',
        'bearer-token-123',
        'jwt_token_with_underscores'
      ];

      // Act & Assert
      jwtTokens.forEach(token => {
        const authResponse: AuthResponse = {
          token,
          user: {
            id: 'user-123',
            email: 'user@example.com',
            role: UserRole.USER,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };
        expect(authResponse.token).toBe(token);
        expect(typeof authResponse.token).toBe('string');
      });
    });

    it('should validate user object structure', () => {
      // Arrange
      const authResponse: AuthResponse = {
        token: 'jwt.token.here',
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: UserRole.USER,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02')
        }
      };

      // Assert
      expect(typeof authResponse.user.id).toBe('string');
      expect(typeof authResponse.user.email).toBe('string');
      expect(Object.values(UserRole)).toContain(authResponse.user.role);
      expect(authResponse.user.createdAt).toBeInstanceOf(Date);
      expect(authResponse.user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Integration Tests', () => {
    it('should work together in a complete user flow', () => {
      // Arrange - Create User Request
      const createRequest: CreateUserRequest = {
        email: 'newuser@example.com',
        password: 'securePassword123',
        role: UserRole.USER
      };

      // Simulate created user
      const createdUser: User = {
        id: 'generated-id-123',
        email: createRequest.email,
        password: 'hashed-' + createRequest.password,
        role: createRequest.role!,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Login Request
      const loginRequest: LoginRequest = {
        email: createRequest.email,
        password: createRequest.password
      };

      // Auth Response
      const authResponse: AuthResponse = {
        token: 'jwt.token.for.user',
        user: {
          id: createdUser.id,
          email: createdUser.email,
          role: createdUser.role,
          createdAt: createdUser.createdAt,
          updatedAt: createdUser.updatedAt
        }
      };

      // Assert
      expect(createRequest.email).toBe(loginRequest.email);
      expect(loginRequest.email).toBe(authResponse.user.email);
      expect(authResponse.user).not.toHaveProperty('password');
      expect(authResponse.user.role).toBe(UserRole.USER);
    });

    it('should handle admin user creation flow', () => {
      // Arrange
      const adminCreateRequest: CreateUserRequest = {
        email: 'admin@company.com',
        password: 'adminPassword123',
        role: UserRole.ADMIN
      };

      const adminUser: User = {
        id: 'admin-id-456',
        email: adminCreateRequest.email,
        password: 'hashed-admin-password',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const adminAuthResponse: AuthResponse = {
        token: 'admin.jwt.token',
        user: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          createdAt: adminUser.createdAt,
          updatedAt: adminUser.updatedAt
        }
      };

      // Assert
      expect(adminCreateRequest.role).toBe(UserRole.ADMIN);
      expect(adminUser.role).toBe(UserRole.ADMIN);
      expect(adminAuthResponse.user.role).toBe(UserRole.ADMIN);
      expect(adminAuthResponse.user.role).toBe('admin');
    });
  });
});