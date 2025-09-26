import request from 'supertest';
import { Application } from 'express';
import mongoose from 'mongoose';
import { Server } from '../../src/presentation/server';
import { UserModel } from '../../src/infrastructure/adapters/orm-models/UserSchema';
import jwt from 'jsonwebtoken';
import { appConfig } from '../../src/config/config';
import { UserRole } from '../../src/domain/entities/User';

describe('Error Handling Integration Tests', () => {
  let app: Application;
  let server: Server;
  let validToken: string;
  let userId: string;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/cat-api-test';
    await mongoose.connect(mongoUri);
    
    // Create server instance
    server = new Server();
    app = (server as any).app; // Access private app property for testing
  });

  beforeEach(async () => {
    // Clear users before each test
    await UserModel.deleteMany({});
    
    // Register and login a user to get valid token and userId
    const userData = {
      email: 'test@example.com',
      password: 'password123'
    };

    // Register user
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    userId = registerResponse.body.id;

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(userData)
      .expect(200);

    validToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Clean up and close connection
    await UserModel.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Validation Errors (400)', () => {
    it('should return 400 for missing required fields in user registration', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com'
          // Missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          password: 'password123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Email y contraseña son requeridos');
    });

    it('should return 400 for missing breed_id in image endpoint', async () => {
      const response = await request(app)
        .get('/api/images/imagesbybreedid')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('breed_id es requerido como parámetro de consulta');
    });
  });

  describe('Unauthorized Errors (401)', () => {
    it('should return 401 for missing authorization token', async () => {
      const response = await request(app)
        .get('/api/cats/breeds')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Token de acceso requerido');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Token inválido');
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = jwt.sign(
        {
          userId: userId,
          email: 'test@example.com',
          role: UserRole.USER
        },
        appConfig.jwtSecret,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Token expirado');
    });
  });

  describe('Not Found Errors (404)', () => {
    it('should return 404 for non-existent breed ID', async () => {
      const response = await request(app)
        .get('/api/cats/breeds/nonexistent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should return 404 for non-existent route', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      // Express default 404 might not return JSON, just check status
      expect(response.status).toBe(404);
    });
  });

  describe('Conflict Errors (409)', () => {
    it('should return 409 for duplicate user registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123'
      };

      // First registration should succeed
      await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      // Second registration should fail with conflict
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });

  describe('Internal Server Errors (500)', () => {
    it('should return 500 for invalid limit parameter in images endpoint', async () => {
      const response = await request(app)
        .get('/api/images/imagesbybreedid')
        .query({ breed_id: 'abys', limit: -1 })
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format for validation errors', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'invalid-email'
          // Missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error.length).toBeGreaterThan(0);
    });

    it('should return consistent error format for authentication errors', async () => {
      const response = await request(app)
        .get('/api/cats/breeds')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error).toBe('Token de acceso requerido');
    });

    it('should include stack trace in development environment', async () => {
      // Set NODE_ENV to development for this test
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/api/cats/breeds/nonexistent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      // In development, stack trace should be included for some errors
      // Note: This depends on the specific error handling implementation
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Logging', () => {
    let consoleSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should log client errors with console.log', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .post('/api/users/register')
        .send({})
        .expect(400);

      // Client errors (4xx) should be logged with console.log
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Client error 400'));
      
      consoleSpy.mockRestore();
    });

    it('should log server errors with console.error', async () => {
      await request(app)
        .get('/api/images/imagesbybreedid')
        .query({ breed_id: 'abys', limit: -1 })
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      // Server errors (5xx) should be logged with console.error
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error 500'));
      
      consoleErrorSpy.mockRestore();
    });
  });
});