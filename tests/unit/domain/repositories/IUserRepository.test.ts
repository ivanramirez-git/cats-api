import { IUserRepository } from '../../../../src/domain/repositories/IUserRepository';
import { User, CreateUserRequest, UserRole } from '../../../../src/domain/entities/User';

describe('IUserRepository', () => {
  let mockUserRepository: jest.Mocked<IUserRepository>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: UserRole.USER,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  };

  const mockCreateUserRequest: CreateUserRequest = {
    email: 'newuser@example.com',
    password: 'password123',
    role: UserRole.USER
  };

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn()
    };
  });

  describe('Interface Contract', () => {
    it('should have all required methods', () => {
      expect(mockUserRepository).toHaveProperty('findByEmail');
      expect(mockUserRepository).toHaveProperty('create');
      expect(mockUserRepository).toHaveProperty('findById');
    });

    it('should have correct method signatures', () => {
      expect(typeof mockUserRepository.findByEmail).toBe('function');
      expect(typeof mockUserRepository.create).toBe('function');
      expect(typeof mockUserRepository.findById).toBe('function');
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await mockUserRepository.findByEmail('test@example.com');

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(mockUser);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('password');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should return null when user not found by email', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await mockUserRepository.findByEmail('nonexistent@example.com');

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should handle empty email string', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await mockUserRepository.findByEmail('');

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('');
      expect(result).toBeNull();
    });

    it('should handle invalid email formats', async () => {
      // Arrange
      const invalidEmails = ['invalid-email', '@example.com', 'test@', 'test.example.com'];
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      for (const email of invalidEmails) {
        const result = await mockUserRepository.findByEmail(email);
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
        expect(result).toBeNull();
      }
    });

    it('should handle case-sensitive email searches', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await mockUserRepository.findByEmail('TEST@EXAMPLE.COM');

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('TEST@EXAMPLE.COM');
      expect(result).toEqual(mockUser);
    });

    it('should return promise that resolves to User or null', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const promise = mockUserRepository.findByEmail('test@example.com');

      // Assert
      expect(promise).toBeInstanceOf(Promise);
      const result = await promise;
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create and return new user', async () => {
      // Arrange
      const createdUser: User = {
        id: 'new-user-123',
        email: mockCreateUserRequest.email,
        password: mockCreateUserRequest.password,
        role: mockCreateUserRequest.role || UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await mockUserRepository.create(mockCreateUserRequest);

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith(mockCreateUserRequest);
      expect(result).toEqual(createdUser);
      expect(result.id).toBeDefined();
      expect(result.email).toBe(mockCreateUserRequest.email);
      expect(result.role).toBe(mockCreateUserRequest.role);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle CreateUserRequest with all required fields', async () => {
      // Arrange
      const completeUserRequest: CreateUserRequest = {
        email: 'complete@example.com',
        password: 'securePassword123',
        role: UserRole.ADMIN
      };
      const createdUser: User = {
          id: 'complete-user-123',
          email: completeUserRequest.email,
          password: completeUserRequest.password,
          role: completeUserRequest.role || UserRole.USER,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await mockUserRepository.create(completeUserRequest);

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith(completeUserRequest);
      expect(result).toEqual(createdUser);
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should handle different user roles', async () => {
      // Arrange
      const roles = [UserRole.USER, UserRole.ADMIN];
      
      for (const role of roles) {
        const userRequest: CreateUserRequest = {
          ...mockCreateUserRequest,
          role
        };
        const createdUser: User = {
          id: `user-${role}`,
          email: userRequest.email,
          password: userRequest.password,
          role: userRequest.role || UserRole.USER,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockUserRepository.create.mockResolvedValue(createdUser);

        // Act
        const result = await mockUserRepository.create(userRequest);

        // Assert
        expect(result.role).toBe(role);
      }
    });

    it('should return promise that resolves to User', async () => {
      // Arrange
      const createdUser: User = {
        id: 'promise-user-123',
        email: mockCreateUserRequest.email,
        password: mockCreateUserRequest.password,
        role: mockCreateUserRequest.role || UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const promise = mockUserRepository.create(mockCreateUserRequest);

      // Assert
      expect(promise).toBeInstanceOf(Promise);
      const result = await promise;
      expect(result).toEqual(createdUser);
    });

    it('should handle user creation with different roles', async () => {
      // Arrange
      const adminUserRequest: CreateUserRequest = {
        ...mockCreateUserRequest,
        role: UserRole.ADMIN
      };
      const createdUser: User = {
        id: 'admin-user-123',
        email: adminUserRequest.email,
        password: adminUserRequest.password,
        role: adminUserRequest.role || UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await mockUserRepository.create(adminUserRequest);

      // Assert
      expect(result.role).toBe(UserRole.ADMIN);
    });
  });

  describe('findById', () => {
    it('should return user when found by id', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await mockUserRepository.findById('user-123');

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUser);
      expect(result).toHaveProperty('id', 'user-123');
    });

    it('should return null when user not found by id', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await mockUserRepository.findById('nonexistent-id');

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(result).toBeNull();
    });

    it('should handle empty id string', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await mockUserRepository.findById('');

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith('');
      expect(result).toBeNull();
    });

    it('should handle various id formats', async () => {
      // Arrange
      const idFormats = [
        'uuid-format-123e4567-e89b-12d3-a456-426614174000',
        'numeric-123456',
        'short-id',
        'very-long-id-with-many-characters-and-numbers-123456789'
      ];
      
      for (const id of idFormats) {
        const userWithId: User = { ...mockUser, id };
        mockUserRepository.findById.mockResolvedValue(userWithId);

        // Act
        const result = await mockUserRepository.findById(id);

        // Assert
        expect(mockUserRepository.findById).toHaveBeenCalledWith(id);
        expect(result?.id).toBe(id);
      }
    });

    it('should return promise that resolves to User or null', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const promise = mockUserRepository.findById('user-123');

      // Assert
      expect(promise).toBeInstanceOf(Promise);
      const result = await promise;
      expect(result).toEqual(mockUser);
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors in findByEmail', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockUserRepository.findByEmail.mockRejectedValue(error);

      // Act & Assert
      await expect(mockUserRepository.findByEmail('test@example.com'))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle repository errors in create', async () => {
      // Arrange
      const error = new Error('Duplicate email');
      mockUserRepository.create.mockRejectedValue(error);

      // Act & Assert
      await expect(mockUserRepository.create(mockCreateUserRequest))
        .rejects.toThrow('Duplicate email');
    });

    it('should handle repository errors in findById', async () => {
      // Arrange
      const error = new Error('Invalid ID format');
      mockUserRepository.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(mockUserRepository.findById('invalid-id'))
        .rejects.toThrow('Invalid ID format');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle user lifecycle: create, findById, findByEmail', async () => {
      // Arrange
      const createdUser: User = {
        id: 'lifecycle-user-123',
        email: mockCreateUserRequest.email,
        password: mockCreateUserRequest.password,
        role: mockCreateUserRequest.role || UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockUserRepository.create.mockResolvedValue(createdUser);
      mockUserRepository.findById.mockResolvedValue(createdUser);
      mockUserRepository.findByEmail.mockResolvedValue(createdUser);

      // Act
      const created = await mockUserRepository.create(mockCreateUserRequest);
      const foundById = await mockUserRepository.findById(created.id);
      const foundByEmail = await mockUserRepository.findByEmail(created.email);

      // Assert
      expect(created).toEqual(createdUser);
      expect(foundById).toEqual(createdUser);
      expect(foundByEmail).toEqual(createdUser);
      expect(foundById?.id).toBe(foundByEmail?.id);
    });

    it('should handle multiple concurrent operations', async () => {
      // Arrange
      const users = [
        { ...mockUser, id: 'user-1', email: 'user1@example.com' },
        { ...mockUser, id: 'user-2', email: 'user2@example.com' },
        { ...mockUser, id: 'user-3', email: 'user3@example.com' }
      ];

      mockUserRepository.findById
        .mockResolvedValueOnce(users[0])
        .mockResolvedValueOnce(users[1])
        .mockResolvedValueOnce(users[2]);

      // Act
      const results = await Promise.all([
        mockUserRepository.findById('user-1'),
        mockUserRepository.findById('user-2'),
        mockUserRepository.findById('user-3')
      ]);

      // Assert
      expect(results).toHaveLength(3);
      expect(results[0]?.id).toBe('user-1');
      expect(results[1]?.id).toBe('user-2');
      expect(results[2]?.id).toBe('user-3');
    });

    it('should handle mixed success and null results', async () => {
      // Arrange
      mockUserRepository.findByEmail
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);

      // Act
      const results = await Promise.all([
        mockUserRepository.findByEmail('existing@example.com'),
        mockUserRepository.findByEmail('nonexistent@example.com'),
        mockUserRepository.findByEmail('another@example.com')
      ]);

      // Assert
      expect(results[0]).toEqual(mockUser);
      expect(results[1]).toBeNull();
      expect(results[2]).toEqual(mockUser);
    });
  });

  describe('Type Safety', () => {
    it('should ensure User type compliance in return values', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await mockUserRepository.findById('user-123');

      // Assert
      if (result) {
        expect(typeof result.id).toBe('string');
        expect(typeof result.email).toBe('string');
        expect(typeof result.password).toBe('string');
        expect(typeof result.email).toBe('string');
        expect(Object.values(UserRole)).toContain(result.role);
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should ensure CreateUserRequest type compliance in parameters', async () => {
      // Arrange
      const validRequest: CreateUserRequest = {
        email: 'valid@example.com',
        password: 'validPassword123',
        role: UserRole.USER
      };
      const createdUser: User = {
        id: 'created-user-123',
        email: validRequest.email,
        password: validRequest.password,
        role: validRequest.role || UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await mockUserRepository.create(validRequest);

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith(validRequest);
      expect(result).toEqual(createdUser);
    });
  });
});