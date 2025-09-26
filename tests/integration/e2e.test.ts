import request from 'supertest';
import { Application } from 'express';
import { Server } from '../../src/presentation/server';
import mongoose from 'mongoose';
import { UserModel } from '../../src/infrastructure/adapters/orm-models/UserSchema';
import jwt from 'jsonwebtoken';
import { appConfig } from '../../src/config/config';
import { CatApiClient } from '../../src/infrastructure/adapters/api-client/CatApiClient';

// Mock CatApiClient
jest.mock('../../src/infrastructure/adapters/api-client/CatApiClient');
const MockedCatApiClient = CatApiClient as jest.MockedClass<typeof CatApiClient>;

describe('E2E Integration Tests', () => {
  let server: Server;
  let app: Application;
  let mockCatApiClient: jest.Mocked<CatApiClient>;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/cat-api-test';
    await mongoose.connect(mongoUri);
    
    // Setup mock CatApiClient
    mockCatApiClient = {
      getBreeds: jest.fn(),
      getBreedById: jest.fn(),
      searchBreeds: jest.fn(),
      getImagesByBreedId: jest.fn()
    } as any;
    
    MockedCatApiClient.mockImplementation(() => mockCatApiClient);
    
    // Initialize server
    server = new Server();
    app = (server as any).app; // Access private app property for testing
  });

  afterAll(async () => {
    // Clean up and close connection
    await UserModel.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users before each test
    await UserModel.deleteMany({});
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Complete Application Flow', () => {
    it('should complete full user journey: register → login → get breeds → search breeds → get images', async () => {
      const testUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(testUser)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('email', testUser.email);
      expect(registerResponse.body).toHaveProperty('id');
      expect(registerResponse.body).toHaveProperty('role', 'user');
      expect(registerResponse.body).not.toHaveProperty('password');

      // Step 2: Login user
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body).toHaveProperty('user');
      const token = loginResponse.body.token;

      // Step 3: Get breeds (protected endpoint)
      const mockBreeds = [
        {
          id: 'abys',
          name: 'Abyssinian',
          description: 'The Abyssinian is easy to care for.',
          temperament: 'Active, Energetic, Independent',
          origin: 'Egypt',
          life_span: '14 - 15',
          weight: { imperial: '7  -  10', metric: '3 - 5' }
        },
        {
          id: 'aege',
          name: 'Aegean',
          description: 'Native to the Greek islands.',
          temperament: 'Affectionate, Social, Intelligent',
          origin: 'Greece',
          life_span: '9 - 12',
          weight: { imperial: '7 - 10', metric: '3 - 5' }
        }
      ];

      mockCatApiClient.getBreeds.mockResolvedValue(mockBreeds);

      const breedsResponse = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(breedsResponse.body)).toBe(true);
      expect(breedsResponse.body).toHaveLength(2);
      expect(breedsResponse.body[0]).toHaveProperty('name', 'Abyssinian');
      expect(mockCatApiClient.getBreeds).toHaveBeenCalledTimes(1);

      // Step 4: Search breeds
      const searchBreeds = [mockBreeds[0]];
      mockCatApiClient.searchBreeds.mockResolvedValue(searchBreeds);

      const searchResponse = await request(app)
        .get('/api/cats/breeds/search?q=Abyssinian')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(searchResponse.body)).toBe(true);
      expect(searchResponse.body).toHaveLength(1);
      expect(searchResponse.body[0]).toHaveProperty('name', 'Abyssinian');
      expect(mockCatApiClient.searchBreeds).toHaveBeenCalledWith('Abyssinian');

      // Step 5: Get images by breed ID
      const mockImages = [
        {
          id: 'img1',
          url: 'https://example.com/cat1.jpg',
          width: 800,
          height: 600
        },
        {
          id: 'img2',
          url: 'https://example.com/cat2.jpg',
          width: 1024,
          height: 768
        }
      ];

      mockCatApiClient.getImagesByBreedId.mockResolvedValue(mockImages);

      const imagesResponse = await request(app)
        .get('/api/images/imagesbybreedid?breed_id=abys&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(imagesResponse.body)).toBe(true);
      expect(imagesResponse.body).toHaveLength(2);
      expect(imagesResponse.body[0]).toHaveProperty('url');
      expect(mockCatApiClient.getImagesByBreedId).toHaveBeenCalledWith('abys', 2);
    });
  });

  describe('Authentication Flow Tests', () => {
    it('should handle authentication flow with token expiration', async () => {
      const testUser = {
        username: 'authuser',
        email: 'auth@example.com',
        password: 'password123'
      };

      // Register and login
      await request(app)
        .post('/api/users/register')
        .send(testUser)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      const validToken = loginResponse.body.token;

      // Test with valid token
      mockCatApiClient.getBreeds.mockResolvedValue([]);
      
      await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Test with expired token (simulate by creating an expired token)
      const expiredToken = jwt.sign(
        { userId: 'test-id', email: testUser.email },
        appConfig.jwtSecret,
        { expiresIn: '-1h' } // Already expired
      );

      await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      // Test with invalid token
      await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Test without token
      await request(app)
        .get('/api/cats/breeds')
        .expect(401);
    });
  });

  describe('Error Handling Chain Tests', () => {
    it('should handle cascading errors properly', async () => {
      const testUser = {
        username: 'erroruser',
        email: 'error@example.com',
        password: 'password123'
      };

      // Register and login
      await request(app)
        .post('/api/users/register')
        .send(testUser)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      const token = loginResponse.body.token;

      // Test API client error propagation
      mockCatApiClient.getBreeds.mockRejectedValue(new Error('API service unavailable'));

      const errorResponse = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(errorResponse.body).toHaveProperty('error');

      // Test validation error chain
      await request(app)
        .get('/api/images/imagesbybreedid')
        .set('Authorization', `Bearer ${token}`)
        .expect(400); // Missing breed_id parameter

      // Test invalid breed_id format
      await request(app)
        .get('/api/images/imagesbybreedid?breed_id=')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('Concurrency Tests', () => {
    it('should handle multiple simultaneous users', async () => {
      const users = [
        { username: 'user1', email: 'user1@example.com', password: 'password123' },
        { username: 'user2', email: 'user2@example.com', password: 'password123' },
        { username: 'user3', email: 'user3@example.com', password: 'password123' }
      ];

      // Register all users concurrently
      const registerPromises = users.map(user =>
        request(app)
          .post('/api/users/register')
          .send(user)
          .expect(201)
      );

      const registerResults = await Promise.all(registerPromises);
      expect(registerResults).toHaveLength(3);

      // Login all users concurrently
      const loginPromises = users.map(user =>
        request(app)
          .post('/api/users/login')
          .send({ email: user.email, password: user.password })
          .expect(200)
      );

      const loginResults = await Promise.all(loginPromises);
      const tokens = loginResults.map(result => result.body.token);

      // Mock API responses
      mockCatApiClient.getBreeds.mockResolvedValue([
        {
          id: 'test',
          name: 'Test Breed',
          description: 'Test description',
          temperament: 'Friendly',
          origin: 'Test',
          life_span: '10-15',
          weight: { imperial: '8-12', metric: '4-6' }
        }
      ]);

      // Make concurrent requests with different tokens
      const concurrentRequests = tokens.map(token =>
        request(app)
          .get('/api/cats/breeds')
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
      );

      const concurrentResults = await Promise.all(concurrentRequests);
      expect(concurrentResults).toHaveLength(3);
      
      // Verify all requests succeeded
      concurrentResults.forEach(result => {
        expect(Array.isArray(result.body)).toBe(true);
        expect(result.body).toHaveLength(1);
      });
    });
  });

  describe('Validation and Limits Tests', () => {
    let token: string;

    beforeEach(async () => {
      const testUser = {
        username: 'validationuser',
        email: 'validation@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/users/register')
        .send(testUser)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      token = loginResponse.body.token;
    });

    it('should validate input parameters and enforce limits', async () => {
      // Test image limit validation
      mockCatApiClient.getImagesByBreedId.mockResolvedValue([]);

      // Test valid limit
      await request(app)
        .get('/api/images/imagesbybreedid?breed_id=abys&limit=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Test limit too high (should fail with 400 because it's a validation error)
      await request(app)
        .get('/api/images/imagesbybreedid?breed_id=abys&limit=101')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      // Test negative limit (should fail with 400 because it's a validation error)
      await request(app)
        .get('/api/images/imagesbybreedid?breed_id=abys&limit=-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      // Test zero limit (should fail with 400 because it's a validation error)
      await request(app)
        .get('/api/images/imagesbybreedid?breed_id=abys&limit=0')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('should validate search query parameters', async () => {
      mockCatApiClient.searchBreeds.mockResolvedValue([]);

      // Test valid search
      await request(app)
        .get('/api/cats/breeds/search?q=persian')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Test empty search query
      await request(app)
        .get('/api/cats/breeds/search?q=')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      // Test missing search query
      await request(app)
        .get('/api/cats/breeds/search')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      // Test search query too short (single character should be valid based on SearchBreeds logic)
      await request(app)
        .get('/api/cats/breeds/search?q=a')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should validate registration data', async () => {
      // Test missing email
      await request(app)
        .post('/api/users/register')
        .send({
          password: 'password123'
        })
        .expect(400);

      // Test missing password
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com'
        })
        .expect(400);

      // Test password too short
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: '123'
        })
        .expect(400);

      // Test duplicate email
      const validUser = {
        username: 'testuser1',
        email: 'duplicate@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/users/register')
        .send(validUser)
        .expect(201);

      // Try to register with same email (should return 409 for conflict)
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123'
        })
        .expect(409);
    });
  });
});