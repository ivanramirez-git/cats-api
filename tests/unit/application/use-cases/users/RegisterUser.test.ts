import { RegisterUser } from '../../../../../src/application/use-cases/users/RegisterUser';
import { IUserRepository } from '../../../../../src/domain/repositories/IUserRepository';
import { CreateUserRequest, User, UserRole } from '../../../../../src/domain/entities/User';
import { PasswordService } from '../../../../../src/application/services/PasswordService';
import { ValidationError, ConflictError } from '../../../../../src/domain/exceptions/ApplicationError';

// Mock PasswordService
jest.mock('../../../../../src/application/services/PasswordService');
const mockPasswordService = PasswordService as jest.Mocked<typeof PasswordService>;

// Mock UserRepository
class MockUserRepository implements IUserRepository {
  private users: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async create(userData: CreateUserRequest): Promise<User> {
    const user: User = {
      id: `user-${Date.now()}`,
      email: userData.email,
      password: userData.password,
      role: userData.role || UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    this.users[userIndex] = { ...this.users[userIndex], ...userData, updatedAt: new Date() };
    return this.users[userIndex];
  }

  async delete(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;
    
    this.users.splice(userIndex, 1);
    return true;
  }

  // Helper methods for testing
  addUser(user: User): void {
    this.users.push(user);
  }

  clear(): void {
    this.users = [];
  }
}

describe('RegisterUser', () => {
  let registerUser: RegisterUser;
  let mockUserRepository: MockUserRepository;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    registerUser = new RegisterUser(mockUserRepository);
    
    // Reset mocks
    jest.clearAllMocks();
    mockUserRepository.clear();
    
    // Setup default mock behavior
    mockPasswordService.hash.mockResolvedValue('hashed-password');
  });

  describe('Successful registration', () => {
    it('should register a new user successfully', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await registerUser.execute(userData);

      expect(result).toEqual({
        id: expect.any(String),
        email: 'test@example.com',
        role: UserRole.USER,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should register user with specified role', async () => {
      const userData: CreateUserRequest = {
        email: 'admin@example.com',
        password: 'password123',
        role: UserRole.ADMIN
      };

      const result = await registerUser.execute(userData);

      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should use default USER role when not specified', async () => {
      const userData: CreateUserRequest = {
        email: 'user@example.com',
        password: 'password123'
      };

      const result = await registerUser.execute(userData);

      expect(result.role).toBe(UserRole.USER);
    });

    it('should return user without password field', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await registerUser.execute(userData);

      expect(result).not.toHaveProperty('password');
      expect(Object.keys(result)).toEqual(['id', 'email', 'role', 'createdAt', 'updatedAt']);
    });
  });

  describe('Email validation', () => {
    it('should throw ValidationError when email is empty', async () => {
      const userData: CreateUserRequest = {
        email: '',
        password: 'password123'
      };

      await expect(registerUser.execute(userData))
        .rejects
        .toThrow(new ValidationError('Email y contraseña son requeridos'));
    });

    it('should throw ValidationError when email is undefined', async () => {
      const userData = {
        password: 'password123'
      } as CreateUserRequest;

      await expect(registerUser.execute(userData))
        .rejects
        .toThrow(new ValidationError('Email y contraseña son requeridos'));
    });
  });

  describe('Password validation', () => {
    it('should throw ValidationError when password is empty', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: ''
      };

      await expect(registerUser.execute(userData))
        .rejects
        .toThrow(new ValidationError('Email y contraseña son requeridos'));
    });

    it('should throw ValidationError when password is undefined', async () => {
      const userData = {
        email: 'test@example.com'
      } as CreateUserRequest;

      await expect(registerUser.execute(userData))
        .rejects
        .toThrow(new ValidationError('Email y contraseña son requeridos'));
    });

    it('should throw ValidationError when password is less than 6 characters', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: '12345'
      };

      await expect(registerUser.execute(userData))
        .rejects
        .toThrow(new ValidationError('La contraseña debe tener al menos 6 caracteres'));
    });

    it('should accept password with exactly 6 characters', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: '123456'
      };

      const result = await registerUser.execute(userData);

      expect(result.email).toBe('test@example.com');
    });

    it('should accept password with more than 6 characters', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: 'verylongpassword123'
      };

      const result = await registerUser.execute(userData);

      expect(result.email).toBe('test@example.com');
    });
  });

  describe('User existence validation', () => {
    it('should throw ConflictError when user already exists', async () => {
      // Add existing user
      const existingUser: User = {
        id: 'existing-user',
        email: 'existing@example.com',
        password: 'hashed-password',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUserRepository.addUser(existingUser);

      const userData: CreateUserRequest = {
        email: 'existing@example.com',
        password: 'password123'
      };

      await expect(registerUser.execute(userData))
        .rejects
        .toThrow(new ConflictError('El usuario ya existe'));
    });

    it('should register user when email does not exist', async () => {
      const userData: CreateUserRequest = {
        email: 'new@example.com',
        password: 'password123'
      };

      const result = await registerUser.execute(userData);

      expect(result.email).toBe('new@example.com');
    });

    it('should be case sensitive for email comparison', async () => {
      // Add existing user with lowercase email
      const existingUser: User = {
        id: 'existing-user',
        email: 'test@example.com',
        password: 'hashed-password',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUserRepository.addUser(existingUser);

      const userData: CreateUserRequest = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123'
      };

      // Should register successfully as emails are different case
      const result = await registerUser.execute(userData);
      expect(result.email).toBe('TEST@EXAMPLE.COM');
    });
  });

  describe('Password hashing', () => {
    it('should hash password before storing', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: 'plainpassword'
      };

      await registerUser.execute(userData);

      expect(mockPasswordService.hash).toHaveBeenCalledWith('plainpassword');
      expect(mockPasswordService.hash).toHaveBeenCalledTimes(1);
    });

    it('should store hashed password in repository', async () => {
      mockPasswordService.hash.mockResolvedValue('super-secure-hash');
      
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: 'plainpassword'
      };

      await registerUser.execute(userData);

      // Verify the user was created with hashed password
      const createdUser = await mockUserRepository.findByEmail('test@example.com');
      expect(createdUser?.password).toBe('super-secure-hash');
    });
  });

  describe('Repository integration', () => {
    it('should call findByEmail to check user existence', async () => {
      const findByEmailSpy = jest.spyOn(mockUserRepository, 'findByEmail');
      
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      await registerUser.execute(userData);

      expect(findByEmailSpy).toHaveBeenCalledWith('test@example.com');
      expect(findByEmailSpy).toHaveBeenCalledTimes(1);
    });

    it('should call create with correct user data', async () => {
      const createSpy = jest.spyOn(mockUserRepository, 'create');
      mockPasswordService.hash.mockResolvedValue('hashed-password');
      
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.ADMIN
      };

      await registerUser.execute(userData);

      expect(createSpy).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashed-password',
        role: UserRole.ADMIN
      });
      expect(createSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Return value', () => {
    it('should return Promise<Omit<User, "password">>', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await registerUser.execute(userData);

      expect(result).toBeInstanceOf(Object);
      expect(typeof result.id).toBe('string');
      expect(typeof result.email).toBe('string');
      expect(Object.values(UserRole)).toContain(result.role);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should maintain user data integrity', async () => {
      const userData: CreateUserRequest = {
        email: 'integrity@example.com',
        password: 'password123',
        role: UserRole.ADMIN
      };

      const result = await registerUser.execute(userData);

      expect(result.email).toBe(userData.email);
      expect(result.role).toBe(userData.role);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in email', async () => {
      const userData: CreateUserRequest = {
        email: 'test+special@example-domain.co.uk',
        password: 'password123'
      };

      const result = await registerUser.execute(userData);

      expect(result.email).toBe('test+special@example-domain.co.uk');
    });

    it('should handle special characters in password', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: 'p@ssw0rd!#$%'
      };

      const result = await registerUser.execute(userData);

      expect(mockPasswordService.hash).toHaveBeenCalledWith('p@ssw0rd!#$%');
      expect(result.email).toBe('test@example.com');
    });

    it('should handle very long email', async () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      const userData: CreateUserRequest = {
        email: longEmail,
        password: 'password123'
      };

      const result = await registerUser.execute(userData);

      expect(result.email).toBe(longEmail);
    });

    it('should handle very long password', async () => {
      const longPassword = 'a'.repeat(100);
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: longPassword
      };

      const result = await registerUser.execute(userData);

      expect(mockPasswordService.hash).toHaveBeenCalledWith(longPassword);
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('Use case behavior', () => {
    it('should validate input before checking user existence', async () => {
      const findByEmailSpy = jest.spyOn(mockUserRepository, 'findByEmail');
      
      const userData: CreateUserRequest = {
        email: '',
        password: 'password123'
      };

      await expect(registerUser.execute(userData))
        .rejects
        .toThrow(ValidationError);

      expect(findByEmailSpy).not.toHaveBeenCalled();
    });

    it('should validate input before hashing password', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: '123'
      };

      await expect(registerUser.execute(userData))
        .rejects
        .toThrow(ValidationError);

      expect(mockPasswordService.hash).not.toHaveBeenCalled();
    });

    it('should check user existence before creating user', async () => {
      const createSpy = jest.spyOn(mockUserRepository, 'create');
      
      // Add existing user
      const existingUser: User = {
        id: 'existing-user',
        email: 'existing@example.com',
        password: 'hashed-password',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUserRepository.addUser(existingUser);

      const userData: CreateUserRequest = {
        email: 'existing@example.com',
        password: 'password123'
      };

      await expect(registerUser.execute(userData))
        .rejects
        .toThrow(ConflictError);

      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should execute all required operations', async () => {
      const findByEmailSpy = jest.spyOn(mockUserRepository, 'findByEmail');
      const createSpy = jest.spyOn(mockUserRepository, 'create');
      
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      await registerUser.execute(userData);

      // Verify all operations were called
      expect(findByEmailSpy).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordService.hash).toHaveBeenCalledWith('password123');
      expect(createSpy).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashed-password',
        role: UserRole.USER
      });
    });
  });
});