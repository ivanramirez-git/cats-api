import { UserRepository } from '../../../../../src/infrastructure/adapters/repositories/UserRepository';
import { User, CreateUserRequest, UserRole } from '../../../../../src/domain/entities/User';
import { Types } from 'mongoose';

// Mock UserModel
jest.mock('../../../../../src/infrastructure/adapters/orm-models/UserSchema', () => {
  const mockFindOne = jest.fn();
  const mockFindById = jest.fn();
  const mockUserModelConstructor = jest.fn();
  
  return {
    UserModel: Object.assign(mockUserModelConstructor, {
      findOne: mockFindOne,
      findById: mockFindById
    })
  };
});

// Mock mongoose Types
jest.mock('mongoose', () => ({
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => ({
      toString: () => id || '507f1f77bcf86cd799439011'
    }))
  }
}));

// Get mocked UserModel
const { UserModel } = require('../../../../../src/infrastructure/adapters/orm-models/UserSchema');
const mockUserModel = UserModel as jest.MockedFunction<any> & {
  findOne: jest.MockedFunction<any>;
  findById: jest.MockedFunction<any>;
};
const mockSave = jest.fn();

describe('UserRepository', () => {
  let userRepository: UserRepository;
  const mockObjectId = '507f1f77bcf86cd799439011';
  const mockDate = new Date('2023-01-01T00:00:00.000Z');

  beforeEach(() => {
    userRepository = new UserRepository();
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    const testEmail = 'test@example.com';
    const mockUserDocument = {
      _id: { toString: () => mockObjectId },
      email: testEmail,
      password: 'hashedPassword',
      role: UserRole.USER,
      createdAt: mockDate,
      updatedAt: mockDate
    };

    it('should return user when found by email', async () => {
      // Arrange
      const expectedUser: User = {
        id: mockObjectId,
        email: testEmail,
        password: 'hashedPassword',
        role: UserRole.USER,
        createdAt: mockDate,
        updatedAt: mockDate
      };

      mockUserModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUserDocument)
      });

      // Act
      const result = await userRepository.findByEmail(testEmail);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: testEmail });
      expect(mockUserModel.findOne().lean).toHaveBeenCalled();
    });

    it('should return null when user not found by email', async () => {
      // Arrange
      mockUserModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      // Act
      const result = await userRepository.findByEmail(testEmail);

      // Assert
      expect(result).toBeNull();
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: testEmail });
    });

    it('should handle admin user correctly', async () => {
      // Arrange
      const adminUserDocument = {
        ...mockUserDocument,
        email: 'admin@example.com',
        role: UserRole.ADMIN
      };

      const expectedAdminUser: User = {
        id: mockObjectId,
        email: 'admin@example.com',
        password: 'hashedPassword',
        role: UserRole.ADMIN,
        createdAt: mockDate,
        updatedAt: mockDate
      };

      mockUserModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(adminUserDocument)
      });

      // Act
      const result = await userRepository.findByEmail('admin@example.com');

      // Assert
      expect(result).toEqual(expectedAdminUser);
      expect(result?.role).toBe(UserRole.ADMIN);
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockUserModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(dbError)
      });

      // Act & Assert
      await expect(userRepository.findByEmail(testEmail)).rejects.toThrow('Database connection failed');
    });

    it('should handle special characters in email', async () => {
      // Arrange
      const specialEmail = 'test+tag@sub.domain.co.uk';
      const userWithSpecialEmail = {
        ...mockUserDocument,
        email: specialEmail
      };

      mockUserModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(userWithSpecialEmail)
      });

      // Act
      const result = await userRepository.findByEmail(specialEmail);

      // Assert
      expect(result?.email).toBe(specialEmail);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: specialEmail });
    });
  });

  describe('create', () => {
    const createUserRequest: CreateUserRequest = {
      email: 'newuser@example.com',
      password: 'hashedPassword',
      role: UserRole.USER
    };

    const mockSavedUser = {
      _id: { toString: () => mockObjectId },
      email: createUserRequest.email,
      password: createUserRequest.password,
      role: createUserRequest.role,
      createdAt: mockDate,
      updatedAt: mockDate,
      save: jest.fn()
    };

    beforeEach(() => {
      // Mock the UserModel constructor
      mockUserModel.mockImplementation(() => ({
        ...mockSavedUser,
        save: mockSave.mockResolvedValue(mockSavedUser)
      }));
    });

    it('should create and return new user', async () => {
      // Arrange
      const expectedUser: User = {
        id: mockObjectId,
        email: createUserRequest.email,
        password: createUserRequest.password,
        role: createUserRequest.role as UserRole,
        createdAt: mockDate,
        updatedAt: mockDate
      };

      // Act
      const result = await userRepository.create(createUserRequest);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserModel).toHaveBeenCalledWith(createUserRequest);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should create admin user correctly', async () => {
      // Arrange
      const adminRequest: CreateUserRequest = {
        email: 'admin@example.com',
        password: 'adminPassword',
        role: UserRole.ADMIN
      };

      const mockAdminUser = {
        ...mockSavedUser,
        email: adminRequest.email,
        password: adminRequest.password,
        role: adminRequest.role
      };

      mockUserModel.mockImplementation(() => ({
        ...mockAdminUser,
        save: jest.fn().mockResolvedValue(mockAdminUser)
      }));

      // Act
      const result = await userRepository.create(adminRequest);

      // Assert
      expect(result.role).toBe(UserRole.ADMIN);
      expect(result.email).toBe(adminRequest.email);
    });

    it('should handle save errors', async () => {
      // Arrange
      const saveError = new Error('Failed to save user');
      mockUserModel.mockImplementation(() => ({
        ...mockSavedUser,
        save: jest.fn().mockRejectedValue(saveError)
      }));

      // Act & Assert
      await expect(userRepository.create(createUserRequest)).rejects.toThrow('Failed to save user');
    });

    it('should handle validation errors', async () => {
      // Arrange
      const validationError = new Error('Validation failed: email is required');
      validationError.name = 'ValidationError';
      mockUserModel.mockImplementation(() => ({
        ...mockSavedUser,
        save: jest.fn().mockRejectedValue(validationError)
      }));

      // Act & Assert
      await expect(userRepository.create(createUserRequest)).rejects.toThrow('Validation failed: email is required');
    });

    it('should handle duplicate email errors', async () => {
      // Arrange
      const duplicateError = new Error('E11000 duplicate key error');
      (duplicateError as any).code = 11000;
      mockUserModel.mockImplementation(() => ({
        ...mockSavedUser,
        save: jest.fn().mockRejectedValue(duplicateError)
      }));

      // Act & Assert
      await expect(userRepository.create(createUserRequest)).rejects.toThrow('E11000 duplicate key error');
    });
  });

  describe('findById', () => {
    const testId = mockObjectId;
    const mockUserDocument = {
      _id: { toString: () => testId },
      email: 'test@example.com',
      password: 'hashedPassword',
      role: UserRole.USER,
      createdAt: mockDate,
      updatedAt: mockDate
    };

    it('should return user when found by id', async () => {
      // Arrange
      const expectedUser: User = {
        id: testId,
        email: 'test@example.com',
        password: 'hashedPassword',
        role: UserRole.USER,
        createdAt: mockDate,
        updatedAt: mockDate
      };

      mockUserModel.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUserDocument)
      });

      // Act
      const result = await userRepository.findById(testId);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(testId);
    });

    it('should return null when user not found by id', async () => {
      // Arrange
      mockUserModel.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      // Act
      const result = await userRepository.findById(testId);

      // Assert
      expect(result).toBeNull();
      expect(mockUserModel.findById).toHaveBeenCalledWith(testId);
    });

    it('should handle invalid ObjectId format', async () => {
      // Arrange
      const invalidId = 'invalid-id';
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      
      mockUserModel.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(castError)
      });

      // Act & Assert
      await expect(userRepository.findById(invalidId)).rejects.toThrow('Cast to ObjectId failed');
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockUserModel.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(dbError)
      });

      // Act & Assert
      await expect(userRepository.findById(testId)).rejects.toThrow('Database connection failed');
    });

    it('should handle different ObjectId formats', async () => {
      // Arrange
      const differentIds = [
        '507f1f77bcf86cd799439011',
        '507f191e810c19729de860ea',
        '507f191e810c19729de860eb'
      ];

      for (const id of differentIds) {
        const userDoc = {
          ...mockUserDocument,
          _id: { toString: () => id }
        };

        mockUserModel.findById = jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(userDoc)
        });

        // Act
        const result = await userRepository.findById(id);

        // Assert
        expect(result?.id).toBe(id);
        expect(mockUserModel.findById).toHaveBeenCalledWith(id);
      }
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle user lifecycle: create then find', async () => {
      // Arrange - Create user
      const createRequest: CreateUserRequest = {
        email: 'lifecycle@example.com',
        password: 'password123',
        role: UserRole.USER
      };

      const mockCreatedUser = {
        _id: { toString: () => mockObjectId },
        email: createRequest.email,
        password: createRequest.password,
        role: createRequest.role,
        createdAt: mockDate,
        updatedAt: mockDate,
        save: jest.fn().mockResolvedValue({
          _id: { toString: () => mockObjectId },
          email: createRequest.email,
          password: createRequest.password,
          role: createRequest.role,
          createdAt: mockDate,
          updatedAt: mockDate
        })
      };

      mockUserModel.mockImplementation(() => mockCreatedUser);

      // Act - Create user
      const createdUser = await userRepository.create(createRequest);

      // Arrange - Find user by email
      mockUserModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: { toString: () => mockObjectId },
          email: createRequest.email,
          password: createRequest.password,
          role: createRequest.role,
          createdAt: mockDate,
          updatedAt: mockDate
        })
      });

      // Act - Find user
      const foundUser = await userRepository.findByEmail(createRequest.email);

      // Assert
      expect(createdUser.email).toBe(foundUser?.email);
      expect(createdUser.id).toBe(foundUser?.id);
    });

    it('should handle concurrent operations gracefully', async () => {
      // Arrange
      const email = 'concurrent@example.com';
      const userDoc = {
        _id: { toString: () => mockObjectId },
        email,
        password: 'password',
        role: UserRole.USER,
        createdAt: mockDate,
        updatedAt: mockDate
      };

      mockUserModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(userDoc)
      });

      mockUserModel.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(userDoc)
      });

      // Act - Simulate concurrent operations
      const promises = [
        userRepository.findByEmail(email),
        userRepository.findById(mockObjectId),
        userRepository.findByEmail(email)
      ];

      const results = await Promise.all(promises);

      // Assert
      results.forEach(result => {
        expect(result).not.toBeNull();
        expect(result?.email).toBe(email);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string email', async () => {
      // Arrange
      mockUserModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      // Act
      const result = await userRepository.findByEmail('');

      // Assert
      expect(result).toBeNull();
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: '' });
    });

    it('should handle empty string id', async () => {
      // Arrange
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      
      mockUserModel.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(castError)
      });

      // Act & Assert
      await expect(userRepository.findById('')).rejects.toThrow('Cast to ObjectId failed');
    });

    it('should handle null/undefined values in user document', async () => {
      // Arrange
      const incompleteUserDoc = {
        _id: { toString: () => mockObjectId },
        email: 'test@example.com',
        password: null,
        role: UserRole.USER,
        createdAt: mockDate,
        updatedAt: mockDate
      };

      mockUserModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(incompleteUserDoc)
      });

      // Act
      const result = await userRepository.findByEmail('test@example.com');

      // Assert
      expect(result?.password).toBeNull();
      expect(result?.email).toBe('test@example.com');
    });
  });
});