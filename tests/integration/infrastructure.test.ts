import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Set up environment variables for testing
process.env.JWT_SECRET = 'test_jwt_secret_key_for_integration_tests';
process.env.JWT_EXPIRES_IN = '1h';
process.env.THE_CAT_API_KEY = 'test_api_key';
import { Server } from '../../src/presentation/server';
import { AuthMiddleware } from '../../src/infrastructure/middlewares/AuthMiddleware';
import { ErrorMiddleware } from '../../src/infrastructure/middlewares/ErrorMiddleware';
import { JwtService } from '../../src/infrastructure/adapters/jwt/JwtService';
import { PasswordService } from '../../src/application/services/PasswordService';
import { CatRepository } from '../../src/infrastructure/adapters/repositories/CatRepository';
import { UserRepository } from '../../src/infrastructure/adapters/repositories/UserRepository';
import { CatApiClient } from '../../src/infrastructure/adapters/api-client/CatApiClient';
import { User, CreateUserRequest, UserRole } from '../../src/domain/entities/User';
import { ApplicationError, ValidationError, InternalServerError } from '../../src/domain/exceptions/ApplicationError';
import express from 'express';

// Mock CatApiClient
jest.mock('../../src/infrastructure/adapters/api-client/CatApiClient');
const MockedCatApiClient = CatApiClient as jest.MockedClass<typeof CatApiClient>;

describe('Infrastructure Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let server: Server;
  let app: express.Application;
  let userRepository: UserRepository;
  let catRepository: CatRepository;
  let jwtService: JwtService;
  // PasswordService uses static methods, no instance needed
  let mockCatApiClient: jest.Mocked<CatApiClient>;

  beforeAll(async () => {
    // Setup MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    
    // Initialize repositories first
    userRepository = new UserRepository();
    
    // Initialize services (after repositories)
    jwtService = new JwtService(userRepository);
    // PasswordService uses static methods, no initialization needed
    
    // Setup mock CatApiClient
    mockCatApiClient = new MockedCatApiClient() as jest.Mocked<CatApiClient>;
    MockedCatApiClient.mockImplementation(() => mockCatApiClient);
    
    // Initialize other repositories
    catRepository = new CatRepository(mockCatApiClient);
    
    // Initialize server
    server = new Server();
    app = server.getApp();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('AuthMiddleware Integration', () => {
    let testUser: User;
    let validToken: string;

    beforeEach(async () => {
      // Create test user
      const hashedPassword = await PasswordService.hash('password123');
      const createUserRequest: CreateUserRequest = {
        email: 'test@example.com',
        password: hashedPassword,
        role: UserRole.USER
      };
      testUser = await userRepository.create(createUserRequest);
      
      // Generate valid token
      const payload = { userId: testUser.id, email: testUser.email, role: testUser.role };
      validToken = jwtService.generateToken(payload);
    });

    it('should authenticate user with valid token', async () => {
      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).not.toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token inválido');
    });

    it('should reject request with expired token', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: testUser.id, username: testUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token expirado');
    });

    it('should reject request without authorization header', async () => {
      const response = await request(app)
        .get('/api/cats/breeds');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token de acceso requerido');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token de acceso requerido');
    });
  });

  describe('ErrorMiddleware Integration', () => {
    let testApp: express.Application;

    beforeEach(() => {
      testApp = express();
      testApp.use(express.json());
      
      // Test route that throws different types of errors
      testApp.get('/test-application-error', (req, res, next) => {
        next(new ValidationError('Test application error'));
      });
      
      testApp.get('/test-generic-error', (req, res, next) => {
        next(new Error('Test generic error'));
      });
      
      testApp.get('/test-validation-error', (req, res, next) => {
        const error = new Error('Validation failed');
        error.name = 'ValidationError';
        next(error);
      });
      
      // Apply error middleware
      testApp.use(ErrorMiddleware.handle);
    });

    it('should handle ApplicationError correctly', async () => {
      const response = await request(testApp)
        .get('/test-application-error');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Test application error');
      if (process.env.NODE_ENV === 'development') {
        expect(response.body.stack).toBeDefined();
      }
    });

    it('should handle generic Error correctly', async () => {
      const response = await request(testApp)
        .get('/test-generic-error');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Test generic error');
      if (process.env.NODE_ENV === 'development') {
        expect(response.body.stack).toBeDefined();
      }
    });

    it('should handle validation errors correctly', async () => {
      const response = await request(testApp)
        .get('/test-validation-error');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Validation failed');
      if (process.env.NODE_ENV === 'development') {
        expect(response.body.stack).toBeDefined();
      }
    });
  });

  describe('JwtService Integration', () => {
    const testUserId = 'test-user-id';
    const testEmail = 'test@example.com';

    it('should generate and validate token successfully', async () => {
      // First create a real user in the database
      const hashedPassword = await PasswordService.hash('password123');
      const user = await userRepository.create({
        email: testEmail,
        password: hashedPassword,
        role: UserRole.USER
      });
      
      const payload = { userId: user.id, email: user.email, role: user.role };
      const token = jwtService.generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = await jwtService.verifyToken(token);
      expect(decoded.userId).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    it('should throw error for invalid token', async () => {
      await expect(jwtService.verifyToken('invalid-token')).rejects.toThrow('Token inválido');
    });

    it('should throw error for expired token', async () => {
      // Create a token that will be expired by manipulating the JWT directly
      const expiredToken = jwt.sign(
        { userId: 'test-id', email: 'test@test.com', role: UserRole.USER },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Already expired
      );
      
      await expect(jwtService.verifyToken(expiredToken)).rejects.toThrow('Token expirado');
    });

    it('should generate different tokens for different users', async () => {
      // Create two real users in the database
      const hashedPassword = await PasswordService.hash('password123');
      const user1 = await userRepository.create({
        email: 'user1@test.com',
        password: hashedPassword,
        role: UserRole.USER
      });
      const user2 = await userRepository.create({
        email: 'user2@test.com',
        password: hashedPassword,
        role: UserRole.ADMIN
      });
      
      const payload1 = { userId: user1.id, email: user1.email, role: user1.role };
      const payload2 = { userId: user2.id, email: user2.email, role: user2.role };
      
      const token1 = jwtService.generateToken(payload1);
      const token2 = jwtService.generateToken(payload2);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('PasswordService Integration', () => {
    const testPassword = 'testPassword123';

    it('should hash and verify password successfully', async () => {
      const hashedPassword = await PasswordService.hash(testPassword);
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(testPassword);
      expect(hashedPassword.length).toBeGreaterThan(0);

      const isValid = await PasswordService.verify(testPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'correct-password';
      const hash = await PasswordService.hash(password);
      const isValid = await PasswordService.verify('wrong-password', hash);
      expect(isValid).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await PasswordService.hash(testPassword);
      const hash2 = await PasswordService.hash(testPassword);
      
      expect(hash1).not.toBe(hash2);
      
      // Both should be valid
      expect(await PasswordService.verify(testPassword, hash1)).toBe(true);
      expect(await PasswordService.verify(testPassword, hash2)).toBe(true);
    });

    it('should handle empty password', async () => {
      const hash = await PasswordService.hash('');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      
      const isValid = await PasswordService.verify('', hash);
      expect(isValid).toBe(true);
    });
  });

  describe('CatRepository and CatApiClient Integration', () => {
    beforeEach(() => {
      // Setup mock responses
      mockCatApiClient.getBreeds.mockResolvedValue([
        {
          id: 'breed1',
          name: 'Persian',
          description: 'A long-haired breed',
          temperament: 'Calm, gentle',
          origin: 'Iran',
          life_span: '12-17 years',
          weight: { imperial: '7-12 lbs', metric: '3-5 kg' }
        }
      ]);
      
      mockCatApiClient.getBreedById.mockResolvedValue({
        id: 'breed1',
        name: 'Persian',
        description: 'A long-haired breed',
        temperament: 'Calm, gentle',
        origin: 'Iran',
        life_span: '12-17 years',
        weight: { imperial: '7-12 lbs', metric: '3-5 kg' }
      });
      
      mockCatApiClient.searchBreeds.mockResolvedValue([
        {
          id: 'breed1',
          name: 'Persian',
          description: 'A long-haired breed',
          temperament: 'Calm, gentle',
          origin: 'Iran',
          life_span: '12-17 years',
          weight: { imperial: '7-12 lbs', metric: '3-5 kg' }
        }
      ]);
      
      mockCatApiClient.getImagesByBreedId.mockResolvedValue([
        {
          id: 'image1',
          url: 'https://example.com/cat1.jpg',
          width: 800,
          height: 600
        }
      ]);
    });

    it('should get breeds through repository', async () => {
      const breeds = await catRepository.getBreeds();
      
      expect(mockCatApiClient.getBreeds).toHaveBeenCalledTimes(1);
      expect(breeds).toHaveLength(1);
      expect(breeds[0].name).toBe('Persian');
    });

    it('should get breed by id through repository', async () => {
      const breed = await catRepository.getBreedById('breed1');
      
      expect(mockCatApiClient.getBreedById).toHaveBeenCalledWith('breed1');
      expect(breed).toBeDefined();
      expect(breed?.name).toBe('Persian');
    });

    it('should search breeds through repository', async () => {
      const breeds = await catRepository.searchBreeds('Persian');
      
      expect(mockCatApiClient.searchBreeds).toHaveBeenCalledWith('Persian');
      expect(breeds).toHaveLength(1);
      expect(breeds[0].name).toBe('Persian');
    });

    it('should get images by breed id through repository', async () => {
      const images = await catRepository.getImagesByBreedId('breed1', 5);
      
      expect(mockCatApiClient.getImagesByBreedId).toHaveBeenCalledWith('breed1', 5);
      expect(images).toHaveLength(1);
      expect(images[0].url).toBe('https://example.com/cat1.jpg');
    });

    it('should handle API client errors', async () => {
      mockCatApiClient.getBreeds.mockRejectedValue(new Error('API Error'));
      
      await expect(catRepository.getBreeds()).rejects.toThrow('API Error');
    });
  });

  describe('UserRepository and MongoDB Integration', () => {
    let testUserRequest: CreateUserRequest;

    beforeEach(async () => {
      const hashedPassword = await PasswordService.hash('password123');
      testUserRequest = {
        email: 'test@example.com',
        password: hashedPassword,
        role: UserRole.USER
      };
    });

    it('should save and find user by email', async () => {
      const createdUser = await userRepository.create(testUserRequest);
      
      const foundUser = await userRepository.findByEmail('test@example.com');
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe('test@example.com');
      expect(foundUser?.id).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
    });

    it('should create user and verify properties', async () => {
      const createdUser = await userRepository.create(testUserRequest);
      
      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe('test@example.com');
      expect(createdUser.role).toBe(UserRole.USER);
      expect(createdUser.id).toBeDefined();
      expect(createdUser.createdAt).toBeDefined();
      expect(createdUser.updatedAt).toBeDefined();
    });

    it('should return null for non-existent user', async () => {
      const foundUser = await userRepository.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });

    it('should handle duplicate email', async () => {
      await userRepository.create(testUserRequest);
      
      const duplicateUserRequest: CreateUserRequest = {
        email: 'test@example.com', // Same email
        password: 'differentpassword',
        role: UserRole.USER
      };
      
      await expect(userRepository.create(duplicateUserRequest)).rejects.toThrow();
    });

    it('should create users with different roles', async () => {
      const adminUserRequest: CreateUserRequest = {
        email: 'admin@example.com',
        password: 'adminpassword',
        role: UserRole.ADMIN
      };
      
      const adminUser = await userRepository.create(adminUserRequest);
      expect(adminUser.role).toBe(UserRole.ADMIN);
      
      const regularUser = await userRepository.create(testUserRequest);
      expect(regularUser.role).toBe(UserRole.USER);
    });

    it('should find user by id', async () => {
      const createdUser = await userRepository.create(testUserRequest);
      
      const foundUser = await userRepository.findById(createdUser.id);
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(createdUser.email);
    });
  });

  describe('Database Configuration and Connection', () => {
    it('should have active database connection', () => {
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });

    it('should have correct database name', () => {
      expect(mongoose.connection.name).toBeDefined();
    });

    it('should handle database operations', async () => {
      const collections = await mongoose.connection.db!.listCollections().toArray();
      expect(Array.isArray(collections)).toBe(true);
    });

    it('should create indexes for user collection', async () => {
      // Save a user to trigger index creation
      const hashedPassword = await PasswordService.hash('password123');
      const testUserRequest: CreateUserRequest = {
        email: 'index@test.com',
        password: hashedPassword,
        role: UserRole.USER
      };
      await userRepository.create(testUserRequest);
      
      const userCollection = mongoose.connection.collection('users');
      const indexes = await userCollection.indexes();
      
      // Should have indexes including email (unique index)
      const indexKeys = indexes.map(index => Object.keys(index.key));
      const hasEmailIndex = indexKeys.some(keys => keys.includes('email'));
      expect(hasEmailIndex).toBe(true);
      
      // Verify _id index exists (default)
      const hasIdIndex = indexKeys.some(keys => keys.includes('_id'));
      expect(hasIdIndex).toBe(true);
    });
  });

  describe('Cross-Service Integration', () => {
    it('should integrate authentication flow with all services', async () => {
      // 1. Create user with PasswordService
      const hashedPassword = await PasswordService.hash('password123');
      const userRequest: CreateUserRequest = {
        email: 'integration@test.com',
        password: hashedPassword,
        role: UserRole.USER
      };
      
      // 2. Save user with UserRepository
      const user = await userRepository.create(userRequest);
      
      // 3. Generate token with JwtService
      const payload = { userId: user.id, email: user.email, role: user.role };
      const token = jwtService.generateToken(payload);
      
      // 4. Verify token with JwtService
      const decoded = await jwtService.verifyToken(token);
      expect(decoded.userId).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
      
      // 5. Use token in authenticated request
      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).not.toBe(401);
    });

    it('should handle complete error flow', async () => {
      // Setup CatApiClient to throw error
      mockCatApiClient.getBreeds.mockRejectedValue(new InternalServerError('External API Error'));
      
      // Create authenticated user
      const hashedPassword = await PasswordService.hash('password123');
      const userRequest: CreateUserRequest = {
        email: 'error@test.com',
        password: hashedPassword,
        role: UserRole.USER
      };
      const user = await userRepository.create(userRequest);
        const payload = { userId: user.id, email: user.email, role: user.role };
        const token = jwtService.generateToken(payload);
      
      // Make request that will trigger error
      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('External API Error');
    });
  });
});