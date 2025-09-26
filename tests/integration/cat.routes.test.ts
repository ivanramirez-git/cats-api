import request from 'supertest';
import { Application } from 'express';
import mongoose from 'mongoose';
import { UserModel } from '../../src/infrastructure/adapters/orm-models/UserSchema';

// Create mock functions that we can control
const mockGetBreeds = jest.fn();
const mockGetBreedById = jest.fn();
const mockSearchBreeds = jest.fn();
const mockGetImagesByBreedId = jest.fn();

// Mock CatApiClient to avoid real API calls
jest.mock('../../src/infrastructure/adapters/api-client/CatApiClient', () => {
  return {
    CatApiClient: jest.fn().mockImplementation(() => ({
      getBreeds: mockGetBreeds,
      getBreedById: mockGetBreedById,
      searchBreeds: mockSearchBreeds,
      getImagesByBreedId: mockGetImagesByBreedId
    }))
  };
});

// Import Server after mocking
import { Server } from '../../src/presentation/server';

describe('Cat Routes Integration Tests', () => {
  let app: Application;
  let server: Server;
  let authToken: string;

  const mockBreeds = [
    {
      id: 'abys',
      name: 'Abyssinian',
      description: 'The Abyssinian is easy to care for',
      temperament: 'Active, Energetic, Independent',
      origin: 'Egypt',
      life_span: '14 - 15',
      weight: {
        imperial: '7 - 10',
        metric: '3 - 5'
      }
    },
    {
      id: 'aege',
      name: 'Aegean',
      description: 'Native to the Greek islands',
      temperament: 'Affectionate, Social, Intelligent',
      origin: 'Greece',
      life_span: '9 - 12',
      weight: {
        imperial: '7 - 10',
        metric: '3 - 5'
      }
    }
  ];

  const mockSingleBreed = {
    id: 'abys',
    name: 'Abyssinian',
    description: 'The Abyssinian is easy to care for',
    temperament: 'Active, Energetic, Independent',
    origin: 'Egypt',
    life_span: '14 - 15',
    weight: {
      imperial: '7 - 10',
      metric: '3 - 5'
    }
  };

  const mockSearchResults = [
    {
      id: 'abys',
      name: 'Abyssinian',
      description: 'The Abyssinian is easy to care for',
      temperament: 'Active, Energetic, Independent',
      origin: 'Egypt',
      life_span: '14 - 15',
      weight: {
        imperial: '7 - 10',
        metric: '3 - 5'
      }
    }
  ];

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/cat-api-test';
    await mongoose.connect(mongoUri);
    
    // Create server instance
    server = new Server();
    app = (server as any).app; // Access private app property for testing
  });

  beforeEach(async () => {
    // Clear database
    await UserModel.deleteMany({});
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Register a test user
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Clean up and close connection
    await UserModel.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/cats/breeds', () => {

    it('should get all breeds successfully with authentication', async () => {
      // Arrange
      mockGetBreeds.mockResolvedValue(mockBreeds);
      
      // Act
      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBreeds);
      expect(mockGetBreeds).toHaveBeenCalledTimes(1);
    });

    it('should return 401 when no token provided', async () => {
      // Act
      const response = await request(app)
        .get('/api/cats/breeds')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 when invalid token provided', async () => {
      // Act
      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/cats/breeds/:breed_id', () => {
    it('should get breed by id successfully with authentication', async () => {
      // Arrange
      mockGetBreedById.mockResolvedValue(mockSingleBreed);
      
      // Act
      const response = await request(app)
        .get('/api/cats/breeds/abys')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSingleBreed);
      expect(mockGetBreedById).toHaveBeenCalledWith('abys');
      expect(mockGetBreedById).toHaveBeenCalledTimes(1);
    });

    it('should return 404 when breed not found', async () => {
      // Arrange
      mockGetBreedById.mockResolvedValue(null);
      
      // Act
      const response = await request(app)
        .get('/api/cats/breeds/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(mockGetBreedById).toHaveBeenCalledWith('nonexistent');
      expect(mockGetBreedById).toHaveBeenCalledTimes(1);
    });

    it('should return 401 when no token provided', async () => {
      // Act
      const response = await request(app)
        .get('/api/cats/breeds/abys')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 when invalid token provided', async () => {
        // Act
        const response = await request(app)
          .get('/api/cats/breeds/abys')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        // Assert
        expect(response.body).toHaveProperty('error');
      });

      it('should handle breed_id with special characters', async () => {
        // Arrange
        mockGetBreedById.mockResolvedValue(null);
        
        // Act
        const response = await request(app)
          .get('/api/cats/breeds/test-breed_123')
          .set('Authorization', `Bearer ${authToken}`);

        // Assert
        expect(response.status).toBe(404);
        expect(mockGetBreedById).toHaveBeenCalledWith('test-breed_123');
      });

      it('should handle very long breed_id', async () => {
        // Arrange
        const longBreedId = 'a'.repeat(100);
        mockGetBreedById.mockResolvedValue(null);
        
        // Act
        const response = await request(app)
          .get(`/api/cats/breeds/${longBreedId}`)
          .set('Authorization', `Bearer ${authToken}`);

        // Assert
        expect(response.status).toBe(404);
        expect(mockGetBreedById).toHaveBeenCalledWith(longBreedId);
      });

      it('should handle breed_id with URL encoded characters', async () => {
        // Arrange
        mockGetBreedById.mockResolvedValue(null);
        
        // Act
        const response = await request(app)
          .get('/api/cats/breeds/test%20breed')
          .set('Authorization', `Bearer ${authToken}`);

        // Assert
        expect(response.status).toBe(404);
        expect(mockGetBreedById).toHaveBeenCalledWith('test breed');
      });
   });

   describe('GET /api/cats/breeds/search', () => {
     it('should search breeds successfully with authentication and query parameter', async () => {
       // Arrange
       mockSearchBreeds.mockResolvedValue(mockSearchResults);
       
       // Act
       const response = await request(app)
         .get('/api/cats/breeds/search?q=Abyssinian')
         .set('Authorization', `Bearer ${authToken}`);

       // Assert
       expect(response.status).toBe(200);
       expect(response.body).toEqual(mockSearchResults);
       expect(mockSearchBreeds).toHaveBeenCalledWith('Abyssinian');
       expect(mockSearchBreeds).toHaveBeenCalledTimes(1);
     });

     it('should return empty array when no breeds found', async () => {
       // Arrange
       mockSearchBreeds.mockResolvedValue([]);
       
       // Act
       const response = await request(app)
         .get('/api/cats/breeds/search?q=NonExistentBreed')
         .set('Authorization', `Bearer ${authToken}`);

       // Assert
       expect(response.status).toBe(200);
       expect(response.body).toEqual([]);
       expect(mockSearchBreeds).toHaveBeenCalledWith('NonExistentBreed');
       expect(mockSearchBreeds).toHaveBeenCalledTimes(1);
     });

     it('should return 400 when q query parameter is missing', async () => {
       // Act
       const response = await request(app)
         .get('/api/cats/breeds/search')
         .set('Authorization', `Bearer ${authToken}`);

       // Assert
       expect(response.status).toBe(400);
       expect(response.body).toHaveProperty('error');
     });

     it('should return 400 when q query parameter is empty string', async () => {
       // Act
       const response = await request(app)
         .get('/api/cats/breeds/search?q=')
         .set('Authorization', `Bearer ${authToken}`);

       // Assert
       expect(response.status).toBe(400);
       expect(response.body).toHaveProperty('error');
     });

     it('should return 400 when q query parameter is only whitespace', async () => {
       // Act
       const response = await request(app)
         .get('/api/cats/breeds/search?q=   ')
         .set('Authorization', `Bearer ${authToken}`);

       // Assert
       expect(response.status).toBe(400);
       expect(response.body).toHaveProperty('error');
     });

     it('should handle special characters in search query', async () => {
       // Arrange
       mockSearchBreeds.mockResolvedValue([]);
       
       // Act
       const response = await request(app)
         .get('/api/cats/breeds/search?q=Test%20%26%20Special')
         .set('Authorization', `Bearer ${authToken}`);

       // Assert
       expect(response.status).toBe(200);
       expect(response.body).toEqual([]);
       expect(mockSearchBreeds).toHaveBeenCalledWith('Test & Special');
     });

     it('should return 401 when no token provided', async () => {
       // Act
       const response = await request(app)
         .get('/api/cats/breeds/search?q=Abyssinian')
         .expect(401);

       // Assert
       expect(response.body).toHaveProperty('error');
     });

     it('should return 401 when invalid token provided', async () => {
       // Act
       const response = await request(app)
         .get('/api/cats/breeds/search?q=Abyssinian')
         .set('Authorization', 'Bearer invalid-token')
         .expect(401);

       // Assert
       expect(response.body).toHaveProperty('error');
     });
   });
 });