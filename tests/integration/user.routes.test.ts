import request from 'supertest';
import { Application } from 'express';
import { Server } from '../../src/presentation/server';
import mongoose from 'mongoose';
import { UserModel } from '../../src/infrastructure/adapters/orm-models/UserSchema';

describe('User Routes Integration Tests', () => {
  let app: Application;
  let server: Server;

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
  });

  afterAll(async () => {
    // Clean up and close connection
    await UserModel.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('role');
      expect(response.body.email).toBe(userData.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 400 for short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123' // Too short
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing required fields', async () => {
      const userData = {
        email: 'test@example.com'
        // Missing password
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Register user first time
      await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      // Try to register same email again
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/users/register')
        .send(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing credentials', async () => {
      const loginData = {
        email: 'test@example.com'
        // Missing password
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});