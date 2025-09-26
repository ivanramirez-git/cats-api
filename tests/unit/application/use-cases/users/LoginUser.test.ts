import { LoginUser } from '../../../../../src/application/use-cases/users/LoginUser';
import { IUserRepository } from '../../../../../src/domain/repositories/IUserRepository';
import { LoginRequest, AuthResponse, User, UserRole } from '../../../../../src/domain/entities/User';
import { PasswordService } from '../../../../../src/application/services/PasswordService';
import { JwtService } from '../../../../../src/infrastructure/adapters/jwt/JwtService';
import { ValidationError, UnauthorizedError } from '../../../../../src/domain/exceptions/ApplicationError';

// Mock PasswordService
jest.mock('../../../../../src/application/services/PasswordService');
const mockPasswordService = PasswordService as jest.Mocked<typeof PasswordService>;

// Mock JwtService
class MockJwtService {
  generateToken(payload: any): string {
    return `mock-jwt-token-${JSON.stringify(payload)}`;
  }

  verifyToken(token: string): any {
    return { userId: 'user-123', email: 'test@example.com', role: UserRole.USER };
  }
}

// Mock UserRepository
class MockUserRepository implements IUserRepository {
  private users: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async create(userData: any): Promise<User> {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: userData.email,
      password: userData.password,
      role: userData.role || UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    this.users[userIndex] = { ...this.users[userIndex], ...userData, updatedAt: new Date() };
    return this.users[userIndex];
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter(user => user.id !== id);
  }

  async validateCredentials(loginData: any): Promise<User | null> {
    return null;
  }

  // Helper method for testing
  setUsers(users: User[]): void {
    this.users = [...users];
  }
}

describe('LoginUser Use Case', () => {
  let loginUser: LoginUser;
  let mockUserRepository: MockUserRepository;
  let mockJwtService: MockJwtService;
  let validLoginData: LoginRequest;
  let existingUser: User;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    mockJwtService = new MockJwtService();
    loginUser = new LoginUser(mockUserRepository, mockJwtService as any);
    
    validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    existingUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashedPassword123',
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Reset mocks
    jest.clearAllMocks();
    mockPasswordService.verify.mockResolvedValue(true);
  });

  describe('Successful login', () => {
    beforeEach(() => {
      mockUserRepository.setUsers([existingUser]);
    });

    it('should login user successfully with valid credentials', async () => {
      const result = await loginUser.execute(validLoginData);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id', 'user-123');
      expect(result.user).toHaveProperty('email', 'test@example.com');
      expect(result.user).toHaveProperty('role', UserRole.USER);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should generate JWT token with correct payload', async () => {
      const generateTokenSpy = jest.spyOn(mockJwtService, 'generateToken');
      
      await loginUser.execute(validLoginData);

      expect(generateTokenSpy).toHaveBeenCalledWith({
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER
      });
    });

    it('should return AuthResponse with token and user', async () => {
      const result = await loginUser.execute(validLoginData);

      expect(result).toMatchObject({
        token: expect.any(String),
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: UserRole.USER,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should verify password using PasswordService', async () => {
      await loginUser.execute(validLoginData);

      expect(mockPasswordService.verify).toHaveBeenCalledWith(
        'password123',
        'hashedPassword123'
      );
      expect(mockPasswordService.verify).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validation errors', () => {
    it('should throw ValidationError when email is missing', async () => {
      const invalidData = { ...validLoginData, email: '' };
      
      await expect(loginUser.execute(invalidData))
        .rejects
        .toThrow(ValidationError);
      
      await expect(loginUser.execute(invalidData))
        .rejects
        .toThrow('Email y contraseña son requeridos');
    });

    it('should throw ValidationError when password is missing', async () => {
      const invalidData = { ...validLoginData, password: '' };
      
      await expect(loginUser.execute(invalidData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when both email and password are missing', async () => {
      const invalidData = { email: '', password: '' };
      
      await expect(loginUser.execute(invalidData))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('Authentication errors', () => {
    it('should throw UnauthorizedError when user does not exist', async () => {
      // No users in repository
      mockUserRepository.setUsers([]);
      
      await expect(loginUser.execute(validLoginData))
        .rejects
        .toThrow(UnauthorizedError);
      
      await expect(loginUser.execute(validLoginData))
        .rejects
        .toThrow('Credenciales inválidas');
    });

    it('should throw UnauthorizedError when password is invalid', async () => {
      mockUserRepository.setUsers([existingUser]);
      mockPasswordService.verify.mockResolvedValue(false);
      
      await expect(loginUser.execute(validLoginData))
        .rejects
        .toThrow(UnauthorizedError);
      
      await expect(loginUser.execute(validLoginData))
        .rejects
        .toThrow('Credenciales inválidas');
    });
  });

  describe('Repository integration', () => {
    beforeEach(() => {
      mockUserRepository.setUsers([existingUser]);
    });

    it('should call userRepository.findByEmail to find user', async () => {
      const findByEmailSpy = jest.spyOn(mockUserRepository, 'findByEmail');
      
      await loginUser.execute(validLoginData);
      
      expect(findByEmailSpy).toHaveBeenCalledWith('test@example.com');
      expect(findByEmailSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Return value', () => {
    beforeEach(() => {
      mockUserRepository.setUsers([existingUser]);
    });

    it('should return user without password field', async () => {
      const result = await loginUser.execute(validLoginData);
      
      expect(result.user).not.toHaveProperty('password');
      expect(Object.keys(result.user)).toEqual(['id', 'email', 'role', 'createdAt', 'updatedAt']);
    });

    it('should return Promise<AuthResponse>', async () => {
      const result = loginUser.execute(validLoginData);
      
      expect(result).toBeInstanceOf(Promise);
      
      const resolvedResult = await result;
      expect(typeof resolvedResult).toBe('object');
      expect(resolvedResult).toHaveProperty('token');
      expect(resolvedResult).toHaveProperty('user');
    });

    it('should return valid token string', async () => {
      const result = await loginUser.execute(validLoginData);
      
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
      expect(result.token).toContain('mock-jwt-token');
    });
  });

  describe('Different user roles', () => {
    it('should login ADMIN user successfully', async () => {
      const adminUser = { ...existingUser, role: UserRole.ADMIN };
      mockUserRepository.setUsers([adminUser]);
      
      const result = await loginUser.execute(validLoginData);
      
      expect(result.user.role).toBe(UserRole.ADMIN);
    });
  });
});