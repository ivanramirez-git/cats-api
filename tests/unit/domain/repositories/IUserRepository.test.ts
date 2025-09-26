import { IUserRepository } from '../../../../src/domain/repositories/IUserRepository';
import { User, CreateUserRequest, LoginRequest, AuthResponse, UserRole } from '../../../../src/domain/entities/User';

// Mock implementation for testing interface contract
class MockUserRepository implements IUserRepository {
  private users: User[] = [];

  async findById(id: string): Promise<User | null> {
    const user = this.users.find(u => u.id === id);
    return Promise.resolve(user || null);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find(u => u.email === email);
    return Promise.resolve(user || null);
  }

  async create(userData: CreateUserRequest): Promise<User> {
    const newUser: User = {
      id: `user_${Date.now()}`,
      email: userData.email,
      password: userData.password,
      role: userData.role || UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return Promise.resolve(newUser);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return Promise.resolve(null);
    }
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
      updatedAt: new Date()
    };
    return Promise.resolve(this.users[userIndex]);
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter(u => u.id !== id);
    return Promise.resolve();
  }

  async validateCredentials(credentials: LoginRequest): Promise<User | null> {
    const user = this.users.find(u => 
      u.email === credentials.email && u.password === credentials.password
    );
    return Promise.resolve(user || null);
  }

  // Helper method for testing
  setUsers(users: User[]): void {
    this.users = [...users];
  }
}

describe('IUserRepository Interface Contract', () => {
  let repository: MockUserRepository;
  let sampleUser: User;
  let sampleCreateRequest: CreateUserRequest;
  let sampleLoginRequest: LoginRequest;

  beforeEach(() => {
    repository = new MockUserRepository();
    
    sampleUser = {
      id: 'user1',
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: UserRole.USER,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    sampleCreateRequest = {
      email: 'newuser@example.com',
      password: 'password123',
      role: UserRole.USER
    };

    sampleLoginRequest = {
      email: 'test@example.com',
      password: 'hashedpassword123'
    };
  });

  describe('findById method', () => {
    beforeEach(() => {
      repository.setUsers([sampleUser]);
    });

    it('should return user when found by id', async () => {
      const result = await repository.findById('user1');
      expect(result).toEqual(sampleUser);
    });

    it('should return null when user not found', async () => {
      const result = await repository.findById('nonexistent');
      expect(result).toBeNull();
    });

    it('should accept string parameter and return Promise<User | null>', async () => {
      const result = repository.findById('user1');
      expect(result).toBeInstanceOf(Promise);
      
      const resolvedResult = await result;
      expect(resolvedResult === null || typeof resolvedResult === 'object').toBe(true);
    });
  });

  describe('findByEmail method', () => {
    beforeEach(() => {
      repository.setUsers([sampleUser]);
    });

    it('should return user when found by email', async () => {
      const result = await repository.findByEmail('test@example.com');
      expect(result).toEqual(sampleUser);
    });

    it('should return null when user not found by email', async () => {
      const result = await repository.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should be case sensitive for email search', async () => {
      const result = await repository.findByEmail('TEST@EXAMPLE.COM');
      expect(result).toBeNull();
    });

    it('should accept string parameter and return Promise<User | null>', async () => {
      const result = repository.findByEmail('test@example.com');
      expect(result).toBeInstanceOf(Promise);
      
      const resolvedResult = await result;
      expect(resolvedResult === null || typeof resolvedResult === 'object').toBe(true);
    });
  });

  describe('create method', () => {
    it('should create new user with provided data', async () => {
      const result = await repository.create(sampleCreateRequest);
      
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(sampleCreateRequest.email);
      expect(result.password).toBe(sampleCreateRequest.password);
      expect(result.role).toBe(sampleCreateRequest.role);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should create user with default USER role when role not provided', async () => {
      const requestWithoutRole: CreateUserRequest = {
        email: 'norole@example.com',
        password: 'password123'
      };
      
      const result = await repository.create(requestWithoutRole);
      expect(result.role).toBe(UserRole.USER);
    });

    it('should create user with ADMIN role when specified', async () => {
      const adminRequest: CreateUserRequest = {
        ...sampleCreateRequest,
        role: UserRole.ADMIN
      };
      
      const result = await repository.create(adminRequest);
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should accept CreateUserRequest and return Promise<User>', async () => {
      const result = repository.create(sampleCreateRequest);
      expect(result).toBeInstanceOf(Promise);
      
      const resolvedResult = await result;
      expect(typeof resolvedResult).toBe('object');
      expect(resolvedResult).toHaveProperty('id');
      expect(resolvedResult).toHaveProperty('email');
    });
  });

  describe('update method', () => {
    beforeEach(async () => {
      await repository.create(sampleCreateRequest);
      repository.setUsers([sampleUser]);
    });

    it('should update existing user', async () => {
      const updateData = { role: UserRole.ADMIN };
      const result = await repository.update('user1', updateData);
      
      expect(result).not.toBeNull();
      expect(result!.role).toBe(UserRole.ADMIN);
      expect(result!.email).toBe(sampleUser.email); // Should keep original email
    });

    it('should return null when updating non-existent user', async () => {
      const result = await repository.update('nonexistent', { role: UserRole.ADMIN });
      expect(result).toBeNull();
    });

    it('should update updatedAt timestamp', async () => {
      const originalUpdatedAt = sampleUser.updatedAt;
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const result = await repository.update('user1', { role: UserRole.ADMIN });
      expect(result!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should accept string id and Partial<User> and return Promise<User | null>', async () => {
      const result = repository.update('user1', { role: UserRole.ADMIN });
      expect(result).toBeInstanceOf(Promise);
      
      const resolvedResult = await result;
      expect(resolvedResult === null || typeof resolvedResult === 'object').toBe(true);
    });
  });

  describe('delete method', () => {
    beforeEach(() => {
      repository.setUsers([sampleUser]);
    });

    it('should delete user by id', async () => {
      await repository.delete('user1');
      
      const result = await repository.findById('user1');
      expect(result).toBeNull();
    });

    it('should not throw error when deleting non-existent user', async () => {
      await expect(repository.delete('nonexistent')).resolves.toBeUndefined();
    });

    it('should accept string parameter and return Promise<void>', async () => {
      const result = repository.delete('user1');
      expect(result).toBeInstanceOf(Promise);
      
      const resolvedResult = await result;
      expect(resolvedResult).toBeUndefined();
    });
  });

  describe('validateCredentials method', () => {
    beforeEach(() => {
      repository.setUsers([sampleUser]);
    });

    it('should return user when credentials are valid', async () => {
      const result = await repository.validateCredentials(sampleLoginRequest);
      expect(result).toEqual(sampleUser);
    });

    it('should return null when email is incorrect', async () => {
      const invalidRequest = { ...sampleLoginRequest, email: 'wrong@example.com' };
      const result = await repository.validateCredentials(invalidRequest);
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const invalidRequest = { ...sampleLoginRequest, password: 'wrongpassword' };
      const result = await repository.validateCredentials(invalidRequest);
      expect(result).toBeNull();
    });

    it('should return null when both email and password are incorrect', async () => {
      const invalidRequest = { email: 'wrong@example.com', password: 'wrongpassword' };
      const result = await repository.validateCredentials(invalidRequest);
      expect(result).toBeNull();
    });

    it('should accept LoginRequest and return Promise<User | null>', async () => {
      const result = repository.validateCredentials(sampleLoginRequest);
      expect(result).toBeInstanceOf(Promise);
      
      const resolvedResult = await result;
      expect(resolvedResult === null || typeof resolvedResult === 'object').toBe(true);
    });
  });

  describe('Interface compliance', () => {
    it('should implement all required methods', () => {
      expect(typeof repository.findById).toBe('function');
      expect(typeof repository.findByEmail).toBe('function');
      expect(typeof repository.create).toBe('function');
      expect(typeof repository.update).toBe('function');
      expect(typeof repository.delete).toBe('function');
      expect(typeof repository.validateCredentials).toBe('function');
    });

    it('should have correct method signatures', () => {
      // Check that methods exist and can be called
      expect(() => repository.findById('test')).not.toThrow();
      expect(() => repository.findByEmail('test@example.com')).not.toThrow();
      expect(() => repository.create(sampleCreateRequest)).not.toThrow();
      expect(() => repository.update('test', {})).not.toThrow();
      expect(() => repository.delete('test')).not.toThrow();
      expect(() => repository.validateCredentials(sampleLoginRequest)).not.toThrow();
    });
  });
});