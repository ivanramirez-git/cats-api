import mongoose from 'mongoose';
import { UserModel } from '../../src/infrastructure/adapters/orm-models/UserSchema';
import { UserRepository } from '../../src/infrastructure/adapters/repositories/UserRepository';
import { CatRepository } from '../../src/infrastructure/adapters/repositories/CatRepository';
import { RegisterUser } from '../../src/application/use-cases/users/RegisterUser';
import { LoginUser } from '../../src/application/use-cases/users/LoginUser';
import { GetBreeds } from '../../src/application/use-cases/cats/GetBreeds';
import { SearchBreeds } from '../../src/application/use-cases/cats/SearchBreeds';
import { GetBreedById } from '../../src/application/use-cases/cats/GetBreedById';
import { GetImagesByBreedId } from '../../src/application/use-cases/images/GetImagesByBreedId';
import { JwtService } from '../../src/infrastructure/adapters/jwt/JwtService';
import { CatApiClient } from '../../src/infrastructure/adapters/api-client/CatApiClient';
import { UserRole } from '../../src/domain/entities/User';
import { Cat } from '../../src/domain/entities/Cat';
import { ValidationError, ConflictError, UnauthorizedError } from '../../src/domain/exceptions/ApplicationError';

// Mock CatApiClient
jest.mock('../../src/infrastructure/adapters/api-client/CatApiClient');
const MockedCatApiClient = CatApiClient as jest.MockedClass<typeof CatApiClient>;

describe('Use Cases Integration Tests', () => {
  let userRepository: UserRepository;
  let catRepository: CatRepository;
  let jwtService: JwtService;
  let mockCatApiClient: jest.Mocked<CatApiClient>;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/cat-api-test';
    await mongoose.connect(mongoUri);
    
    // Initialize services
    userRepository = new UserRepository();
    jwtService = new JwtService(userRepository);
    
    // Setup mock CatApiClient
    mockCatApiClient = new MockedCatApiClient() as jest.Mocked<CatApiClient>;
    catRepository = new CatRepository(mockCatApiClient);
  });

  beforeEach(async () => {
    // Clear database before each test
    await UserModel.deleteMany({});
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up and close connection
    await UserModel.deleteMany({});
    await mongoose.connection.close();
  });

  describe('RegisterUser Use Case', () => {
    let registerUser: RegisterUser;

    beforeEach(() => {
      registerUser = new RegisterUser(userRepository);
    });

    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER
      };

      const result = await registerUser.execute(userData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', userData.email);
      expect(result).toHaveProperty('role', userData.role);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ValidationError for missing email', async () => {
      const userData = {
        email: '',
        password: 'password123'
      };

      await expect(registerUser.execute(userData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123'
      };

      await expect(registerUser.execute(userData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Register user first time
      await registerUser.execute(userData);

      // Try to register same email again
      await expect(registerUser.execute(userData))
        .rejects.toThrow(ConflictError);
    });

    it('should default to USER role when not specified', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await registerUser.execute(userData);
      expect(result.role).toBe(UserRole.USER);
    });
  });

  describe('LoginUser Use Case', () => {
    let loginUser: LoginUser;
    let registerUser: RegisterUser;

    beforeEach(() => {
      loginUser = new LoginUser(userRepository, jwtService);
      registerUser = new RegisterUser(userRepository);
    });

    it('should login successfully with valid credentials', async () => {
      // First register a user
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };
      await registerUser.execute(userData);

      // Then login
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await loginUser.execute(loginData);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(loginData.email);
      expect(result.user).not.toHaveProperty('password');
      expect(typeof result.token).toBe('string');
    });

    it('should throw ValidationError for missing email', async () => {
      const loginData = {
        email: '',
        password: 'password123'
      };

      await expect(loginUser.execute(loginData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: ''
      };

      await expect(loginUser.execute(loginData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      await expect(loginUser.execute(loginData))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      // First register a user
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };
      await registerUser.execute(userData);

      // Try to login with wrong password
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await expect(loginUser.execute(loginData))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('GetBreeds Use Case', () => {
    let getBreeds: GetBreeds;

    beforeEach(() => {
      getBreeds = new GetBreeds(catRepository);
    });

    it('should return list of breeds successfully', async () => {
      const mockBreeds = [
        { 
          id: '1', 
          name: 'Persian', 
          description: 'Long-haired breed',
          temperament: 'Calm, Gentle',
          origin: 'Iran',
          life_span: '12-17',
          weight: { imperial: '7-12', metric: '3-5' }
        },
        { 
          id: '2', 
          name: 'Siamese', 
          description: 'Short-haired breed',
          temperament: 'Active, Vocal',
          origin: 'Thailand',
          life_span: '12-15',
          weight: { imperial: '6-14', metric: '3-6' }
        }
      ];

      mockCatApiClient.getBreeds.mockResolvedValue(mockBreeds);

      const result = await getBreeds.execute();

      expect(result).toEqual(mockBreeds);
      expect(mockCatApiClient.getBreeds).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no breeds found', async () => {
      mockCatApiClient.getBreeds.mockResolvedValue([]);

      const result = await getBreeds.execute();

      expect(result).toEqual([]);
      expect(mockCatApiClient.getBreeds).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from CatApiClient', async () => {
      const error = new Error('API Error');
      mockCatApiClient.getBreeds.mockRejectedValue(error);

      await expect(getBreeds.execute()).rejects.toThrow('API Error');
    });
  });

  describe('SearchBreeds Use Case', () => {
    let searchBreeds: SearchBreeds;

    beforeEach(() => {
      searchBreeds = new SearchBreeds(catRepository);
    });

    it('should search breeds successfully', async () => {
      const query = 'persian';
      const mockBreeds = [
        { 
          id: '1', 
          name: 'Persian', 
          description: 'Long-haired breed',
          temperament: 'Calm, Gentle',
          origin: 'Iran',
          life_span: '12-17',
          weight: { imperial: '7-12', metric: '3-5' }
        }
      ];

      mockCatApiClient.searchBreeds.mockResolvedValue(mockBreeds);

      const result = await searchBreeds.execute(query);

      expect(result).toEqual(mockBreeds);
      expect(mockCatApiClient.searchBreeds).toHaveBeenCalledWith(query);
    });

    it('should trim query before searching', async () => {
      const query = '  persian  ';
      const mockBreeds = [
        { 
          id: '1', 
          name: 'Persian', 
          description: 'Long-haired breed',
          temperament: 'Calm, Gentle',
          origin: 'Iran',
          life_span: '12-17',
          weight: { imperial: '7-12', metric: '3-5' }
        }
      ];

      mockCatApiClient.searchBreeds.mockResolvedValue(mockBreeds);

      await searchBreeds.execute(query);

      expect(mockCatApiClient.searchBreeds).toHaveBeenCalledWith('persian');
    });

    it('should throw ValidationError for empty query', async () => {
      await expect(searchBreeds.execute(''))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for whitespace-only query', async () => {
      await expect(searchBreeds.execute('   '))
        .rejects.toThrow(ValidationError);
    });

    it('should return empty array when no breeds match', async () => {
      const query = 'nonexistent';
      mockCatApiClient.searchBreeds.mockResolvedValue([]);

      const result = await searchBreeds.execute(query);

      expect(result).toEqual([]);
    });
  });

  describe('GetBreedById Use Case', () => {
    let getBreedById: GetBreedById;

    beforeEach(() => {
      getBreedById = new GetBreedById(catRepository);
    });

    it('should return breed by id successfully', async () => {
      const breedId = '1';
      const mockBreed = { 
        id: '1', 
        name: 'Persian', 
        description: 'Long-haired breed',
        temperament: 'Calm, Gentle',
        origin: 'Iran',
        life_span: '12-17',
        weight: { imperial: '7-12', metric: '3-5' }
      };

      mockCatApiClient.getBreedById.mockResolvedValue(mockBreed);

      const result = await getBreedById.execute(breedId);

      expect(result).toEqual(mockBreed);
      expect(mockCatApiClient.getBreedById).toHaveBeenCalledWith(breedId);
    });

    it('should return null when breed not found', async () => {
      const breedId = 'nonexistent';
      mockCatApiClient.getBreedById.mockResolvedValue(null);

      const result = await getBreedById.execute(breedId);

      expect(result).toBeNull();
    });

    it('should propagate errors from CatApiClient', async () => {
      const breedId = '1';
      const error = new Error('API Error');
      mockCatApiClient.getBreedById.mockRejectedValue(error);

      await expect(getBreedById.execute(breedId)).rejects.toThrow('API Error');
    });
  });

  describe('GetImagesByBreedId Use Case', () => {
    let getImagesByBreedId: GetImagesByBreedId;

    beforeEach(() => {
      getImagesByBreedId = new GetImagesByBreedId(catRepository);
    });

    it('should return images by breed id successfully', async () => {
      const breedId = '1';
      const limit = 5;
      const mockImages: Cat[] = [
        { id: '1', url: 'https://example.com/cat1.jpg', width: 500, height: 400 },
        { id: '2', url: 'https://example.com/cat2.jpg', width: 600, height: 450 }
      ];

      mockCatApiClient.getImagesByBreedId.mockResolvedValue(mockImages);

      const result = await getImagesByBreedId.execute(breedId, limit);

      expect(result).toEqual(mockImages);
      expect(mockCatApiClient.getImagesByBreedId).toHaveBeenCalledWith(breedId, limit);
    });

    it('should use default limit of 10 when not specified', async () => {
      const breedId = '1';
      const mockImages: Cat[] = [];

      mockCatApiClient.getImagesByBreedId.mockResolvedValue(mockImages);

      await getImagesByBreedId.execute(breedId);

      expect(mockCatApiClient.getImagesByBreedId).toHaveBeenCalledWith(breedId, 10);
    });

    it('should trim breed id before processing', async () => {
      const breedId = '  1  ';
      const mockImages: Cat[] = [];

      mockCatApiClient.getImagesByBreedId.mockResolvedValue(mockImages);

      await getImagesByBreedId.execute(breedId);

      expect(mockCatApiClient.getImagesByBreedId).toHaveBeenCalledWith('1', 10);
    });

    it('should throw error for empty breed id', async () => {
      await expect(getImagesByBreedId.execute(''))
        .rejects.toThrow('ID de raza requerido');
    });

    it('should throw error for whitespace-only breed id', async () => {
      await expect(getImagesByBreedId.execute('   '))
        .rejects.toThrow('ID de raza requerido');
    });

    it('should throw error for limit less than 1', async () => {
      await expect(getImagesByBreedId.execute('1', 0))
        .rejects.toThrow('Límite debe estar entre 1 y 100');
    });

    it('should throw error for limit greater than 100', async () => {
      await expect(getImagesByBreedId.execute('1', 101))
        .rejects.toThrow('Límite debe estar entre 1 y 100');
    });

    it('should return empty array when no images found', async () => {
      const breedId = '1';
      mockCatApiClient.getImagesByBreedId.mockResolvedValue([]);

      const result = await getImagesByBreedId.execute(breedId);

      expect(result).toEqual([]);
    });
  });

  describe('Integration between Use Cases and Repositories', () => {
    it('should integrate RegisterUser with UserRepository correctly', async () => {
      const registerUser = new RegisterUser(userRepository);
      const userData = {
        email: 'integration@example.com',
        password: 'password123'
      };

      const result = await registerUser.execute(userData);

      // Verify user was actually saved to database
      const savedUser = await UserModel.findOne({ email: userData.email });
      expect(savedUser).toBeTruthy();
      expect(savedUser!.email).toBe(userData.email);
      expect(result.id).toBe(savedUser!._id.toString());
    });

    it('should integrate LoginUser with UserRepository and JwtService correctly', async () => {
      const registerUser = new RegisterUser(userRepository);
      const loginUser = new LoginUser(userRepository, jwtService);
      
      const userData = {
        email: 'integration@example.com',
        password: 'password123'
      };

      // Register user first
      await registerUser.execute(userData);

      // Then login
      const result = await loginUser.execute(userData);

      expect(result.token).toBeTruthy();
      expect(typeof result.token).toBe('string');
      expect(result.user.email).toBe(userData.email);
    });

    it('should integrate Cat use cases with CatRepository correctly', async () => {
      const getBreeds = new GetBreeds(catRepository);
      const searchBreeds = new SearchBreeds(catRepository);
      const getBreedById = new GetBreedById(catRepository);
      const getImagesByBreedId = new GetImagesByBreedId(catRepository);

      const mockBreeds = [
        { 
          id: '1', 
          name: 'Persian', 
          description: 'Long-haired breed',
          temperament: 'Calm, Gentle',
          origin: 'Iran',
          life_span: '12-17',
          weight: { imperial: '7-12', metric: '3-5' }
        }
      ];
      const mockImages = [
        { id: '1', url: 'https://example.com/cat1.jpg', width: 500, height: 400 }
      ];

      mockCatApiClient.getBreeds.mockResolvedValue(mockBreeds);
      mockCatApiClient.searchBreeds.mockResolvedValue(mockBreeds);
      mockCatApiClient.getBreedById.mockResolvedValue(mockBreeds[0]);
      mockCatApiClient.getImagesByBreedId.mockResolvedValue(mockImages);

      // Test all cat-related use cases
      const breedsResult = await getBreeds.execute();
      const searchResult = await searchBreeds.execute('persian');
      const breedResult = await getBreedById.execute('1');
      const imagesResult = await getImagesByBreedId.execute('1');

      expect(breedsResult).toEqual(mockBreeds);
      expect(searchResult).toEqual(mockBreeds);
      expect(breedResult).toEqual(mockBreeds[0]);
      expect(imagesResult).toEqual(mockImages);
    });
  });
});