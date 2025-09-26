import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { UserModel } from '../../src/infrastructure/adapters/orm-models/UserSchema';
import { Cat } from '../../src/domain/entities/Cat';

// Mock CatApiClient before importing Server
const mockGetImagesByBreedId = jest.fn();
jest.mock('../../src/infrastructure/adapters/api-client/CatApiClient', () => {
  return {
    CatApiClient: jest.fn().mockImplementation(() => ({
      getImagesByBreedId: mockGetImagesByBreedId
    }))
  };
});

// Import Server after mocking
import { Server } from '../../src/presentation/server';

describe('Image Routes Integration Tests', () => {
  let app: Express;
  let server: Server;
  let authToken: string;
  // mockGetImagesByBreedId is already available from the mock above

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/cat-api-test';
    await mongoose.connect(mongoUri);
    
    // Create server instance
    server = new Server();
    app = (server as any).app; // Access private app property for testing
  });

  beforeEach(() => {
    // Reset mock before each test
    mockGetImagesByBreedId.mockReset();
  });

  beforeEach(async () => {
    // Clear users before each test
    await UserModel.deleteMany({});
    
    // Register and login a user to get auth token
    const userData = {
      email: 'test@example.com',
      password: 'password123'
    };

    await request(app)
      .post('/api/users/register')
      .send(userData);

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(userData);

    authToken = loginResponse.body.token;

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up and close connection
    await UserModel.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/images/imagesbybreedid', () => {
    const mockImages: Cat[] = [
      {
        id: 'img1',
        url: 'https://example.com/cat1.jpg',
        width: 800,
        height: 600,
        breeds: [{
          id: 'abys',
          name: 'Abyssinian',
          description: 'Active and playful cat',
          temperament: 'Active, Energetic, Independent',
          origin: 'Egypt',
          life_span: '14 - 15',
          weight: { imperial: '7  -  10', metric: '3 - 5' }
        }]
      },
      {
        id: 'img2',
        url: 'https://example.com/cat2.jpg',
        width: 1024,
        height: 768,
        breeds: [{
          id: 'abys',
          name: 'Abyssinian',
          description: 'Active and playful cat',
          temperament: 'Active, Energetic, Independent',
          origin: 'Egypt',
          life_span: '14 - 15',
          weight: { imperial: '7  -  10', metric: '3 - 5' }
        }]
      }
    ];

    it('should get images by breed_id successfully with authentication', async () => {
      // Mock the CatApiClient response
      mockGetImagesByBreedId.mockResolvedValue(mockImages);
      
      const response = await request(app)
        .get('/api/images/imagesbybreedid?breed_id=abys')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id', 'img1');
      expect(response.body[0]).toHaveProperty('url');
      expect(response.body[0]).toHaveProperty('breeds');
      expect(response.body[1]).toHaveProperty('id', 'img2');
    });

    it('should get images with limit parameter', async () => {
      const limitedImages = [mockImages[0]];
      mockGetImagesByBreedId.mockResolvedValue(limitedImages);
      
      const response = await request(app)
        .get('/api/images/imagesbybreedid?breed_id=abys&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id', 'img1');
    });

    it('should return 400 for missing breed_id parameter', async () => {
      const response = await request(app)
        .get('/api/images/imagesbybreedid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('breed_id es requerido');
    });

    it('should return 400 for empty breed_id parameter', async () => {
      const response = await request(app)
        .get('/api/images/imagesbybreedid?breed_id=')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('breed_id es requerido');
    });

    it('should return 401 for missing authentication token', async () => {
      const response = await request(app)
        .get('/api/images/imagesbybreedid?breed_id=abys')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for invalid authentication token', async () => {
      const response = await request(app)
        .get('/api/images/imagesbybreedid?breed_id=abys')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle CatApiClient errors', async () => {
      // Mock the CatApiClient to throw an error
      mockGetImagesByBreedId.mockRejectedValue(new Error('API Error'));
      
      const response = await request(app)
        .get('/api/images/imagesbybreedid?breed_id=abys')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should return empty array when no images found', async () => {
      // Mock the CatApiClient to return empty array
      mockGetImagesByBreedId.mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/images/imagesbybreedid?breed_id=nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle invalid limit parameter', async () => {
      const response = await request(app)
        .get('/api/images/imagesbybreedid?breed_id=abys&limit=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle limit parameter exceeding maximum', async () => {
      const response = await request(app)
        .get('/api/images/imagesbybreedid?breed_id=abys&limit=101')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});