import request from 'supertest';
import { Application } from 'express';
import { Server } from '../../src/presentation/server';
import mongoose from 'mongoose';
import { UserModel } from '../../src/infrastructure/adapters/orm-models/UserSchema';
import jwt from 'jsonwebtoken';
import { appConfig } from '../../src/config/config';
import { UserRole } from '../../src/domain/entities/User';

describe('Authentication Middleware Integration Tests', () => {
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

    userId = registerResponse.body._id;

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

  describe('Authentication Tests', () => {
    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject request without authorization header', async () => {
      const response = await request(app)
        .get('/api/cats/breeds')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Token de acceso requerido');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Token de acceso requerido');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Token inválido');
    });

    it('should reject request with expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        {
          userId: userId,
          email: 'test@example.com',
          role: UserRole.USER
        },
        appConfig.jwtSecret,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Token expirado');
    });

    it('should reject token for non-existent user', async () => {
      // Create token with non-existent user ID
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();
      const tokenForNonExistentUser = jwt.sign(
        {
          userId: nonExistentUserId,
          email: 'nonexistent@example.com',
          role: UserRole.USER
        },
        appConfig.jwtSecret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', `Bearer ${tokenForNonExistentUser}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Usuario no encontrado');
    });

    it('should reject token with inconsistent user data', async () => {
      // Create token with different email than the one in database
      const inconsistentToken = jwt.sign(
        {
          userId: userId,
          email: 'different@example.com', // Different email
          role: UserRole.USER
        },
        appConfig.jwtSecret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', `Bearer ${inconsistentToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Usuario no encontrado');
    });

    it('should handle malformed JWT token', async () => {
      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', 'Bearer malformed.jwt.token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Token inválido');
    });

    it('should handle empty token after Bearer', async () => {
      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Token de acceso requerido');
    });
  });

  describe('Authorization Tests (Role-based)', () => {
    // Note: Since the current API doesn't have role-based endpoints,
    // we'll test the authorization logic conceptually
    // In a real scenario, you would have admin-only endpoints to test
    
    it('should authenticate user successfully for general endpoints', async () => {
      const response = await request(app)
        .get('/api/cats/breeds')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    // If you had admin-only endpoints, you would test them like this:
    // it('should deny access to admin endpoints for regular users', async () => {
    //   const response = await request(app)
    //     .get('/api/admin/users')
    //     .set('Authorization', `Bearer ${validToken}`)
    //     .expect(403);
    //
    //   expect(response.body).toHaveProperty('error');
    //   expect(response.body.error).toBe('Acceso denegado');
    // });
  });
});