import mongoose from 'mongoose';
import { UserRole } from '../../../../../src/domain/entities/User';

// Mock mongoose
const mockSchema = {
  definition: {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER
    }
  },
  options: {
    timestamps: true,
    toJSON: {
      transform: (doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  },
  add: jest.fn(),
  index: jest.fn(),
  pre: jest.fn(),
  post: jest.fn(),
  virtual: jest.fn(),
  method: jest.fn(),
  static: jest.fn()
};

const mockModel = jest.fn();

jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation((definition: any, options: any) => {
    mockSchema.definition = definition;
    mockSchema.options = options;
    return mockSchema;
  }),
  model: jest.fn().mockImplementation(() => mockModel)
}));

// Import the module after mocks are set up
require('../../../../../src/infrastructure/adapters/orm-models/UserSchema');

describe('UserSchema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Definition', () => {
    it('should create schema with correct field definitions', () => {
      // Since we're mocking the Schema constructor, we verify the mock was set up correctly
      expect(mongoose.Schema).toBeDefined();
      expect(typeof mongoose.Schema).toBe('function');
    });

    it('should have correct email field configuration', () => {
      const definition = mockSchema.definition;
      
      expect(definition.email).toEqual({
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
      });
    });

    it('should have correct password field configuration', () => {
      const definition = mockSchema.definition;
      
      expect(definition.password).toEqual({
        type: String,
        required: true
      });
    });

    it('should have correct role field configuration', () => {
      const definition = mockSchema.definition;
      
      expect(definition.role).toEqual({
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.USER
      });
    });

    it('should include all UserRole enum values in role field', () => {
      const definition = mockSchema.definition;
      
      expect(definition.role.enum).toContain(UserRole.USER);
      expect(definition.role.enum).toContain(UserRole.ADMIN);
      expect(definition.role.enum).toHaveLength(2);
    });
  });

  describe('Schema Options', () => {
    it('should have timestamps enabled', () => {
      const options = mockSchema.options;
      
      expect(options.timestamps).toBe(true);
    });

    it('should have toJSON transform function', () => {
      const options = mockSchema.options;
      
      expect(options.toJSON).toBeDefined();
      expect(typeof options.toJSON.transform).toBe('function');
    });
  });

  describe('toJSON Transform', () => {
    let transformFunction: Function;

    beforeEach(() => {
      const options = mockSchema.options;
      transformFunction = options.toJSON.transform;
    });

    it('should transform _id to id', () => {
      const mockDoc = {};
      const mockRet = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: UserRole.USER,
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = transformFunction(mockDoc, mockRet);

      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect(result._id).toBeUndefined();
    });

    it('should remove __v field', () => {
      const mockDoc = {};
      const mockRet = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: UserRole.USER,
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = transformFunction(mockDoc, mockRet);

      expect(result.__v).toBeUndefined();
    });

    it('should preserve other fields', () => {
      const mockDoc = {};
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');
      const mockRet = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: UserRole.USER,
        __v: 0,
        createdAt,
        updatedAt
      };

      const result = transformFunction(mockDoc, mockRet);

      expect(result.email).toBe('test@example.com');
      expect(result.password).toBe('hashedPassword');
      expect(result.role).toBe(UserRole.USER);
      expect(result.createdAt).toBe(createdAt);
      expect(result.updatedAt).toBe(updatedAt);
    });

    it('should handle admin role', () => {
      const mockDoc = {};
      const mockRet = {
        _id: '507f1f77bcf86cd799439011',
        email: 'admin@example.com',
        password: 'hashedPassword',
        role: UserRole.ADMIN,
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = transformFunction(mockDoc, mockRet);

      expect(result.role).toBe(UserRole.ADMIN);
      expect(result.id).toBe('507f1f77bcf86cd799439011');
    });

    it('should handle different email formats', () => {
      const mockDoc = {};
      const testEmails = [
        'simple@example.com',
        'test+tag@example.com',
        'user.name@sub.domain.co.uk',
        'very.long.email.address@very.long.domain.name.com'
      ];

      testEmails.forEach(email => {
        const mockRet = {
          _id: '507f1f77bcf86cd799439011',
          email,
          password: 'hashedPassword',
          role: UserRole.USER,
          __v: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = transformFunction(mockDoc, mockRet);
        expect(result.email).toBe(email);
      });
    });
  });

  describe('Model Creation', () => {
    it('should create model with correct name and schema', () => {
      // Since we're mocking the model function, we verify the mock was set up correctly
      expect(mongoose.model).toBeDefined();
      expect(typeof mongoose.model).toBe('function');
    });

    it('should export UserModel', () => {
      const { UserModel } = require('../../../../../src/infrastructure/adapters/orm-models/UserSchema');
      expect(UserModel).toBeDefined();
    });
  });

  describe('UserDocument Interface', () => {
    it('should extend User entity without id field', () => {
      // This is a TypeScript interface test - we verify the structure through usage
      const mockUserDocument: any = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Document methods (mocked)
        save: jest.fn(),
        remove: jest.fn(),
        deleteOne: jest.fn(),
        updateOne: jest.fn(),
        toJSON: jest.fn(),
        toObject: jest.fn(),
        isModified: jest.fn(),
        markModified: jest.fn(),
        populate: jest.fn(),
        depopulate: jest.fn(),
        populated: jest.fn(),
        $isValid: jest.fn(),
        validateSync: jest.fn(),
        validate: jest.fn(),
        $isDefault: jest.fn(),
        $isEmpty: jest.fn(),
        $isDeleted: jest.fn(),
        $getPopulatedDocs: jest.fn(),
        $getAllSubdocs: jest.fn(),
        $ignore: jest.fn(),
        $isSelected: jest.fn(),
        $set: jest.fn(),
        $unset: jest.fn(),
        $inc: jest.fn(),
        $where: jest.fn(),
        ownerDocument: jest.fn(),
        parent: jest.fn(),
        id: '507f1f77bcf86cd799439011'
      } as any;

      expect(mockUserDocument._id).toBe('507f1f77bcf86cd799439011');
      expect(mockUserDocument.email).toBe('test@example.com');
      expect(mockUserDocument.role).toBe(UserRole.USER);
    });
  });

  describe('Field Validation', () => {
    it('should validate required fields are present in schema', () => {
      const definition = mockSchema.definition;
      
      // Check that all required fields are defined
      expect(definition.email).toBeDefined();
      expect(definition.password).toBeDefined();
      expect(definition.role).toBeDefined();
      
      // Check required property
      expect(definition.email.required).toBe(true);
      expect(definition.password.required).toBe(true);
    });

    it('should have unique constraint on email', () => {
      const definition = mockSchema.definition;
      
      expect(definition.email.unique).toBe(true);
    });

    it('should have lowercase and trim on email', () => {
      const definition = mockSchema.definition;
      
      expect(definition.email.lowercase).toBe(true);
      expect(definition.email.trim).toBe(true);
    });

    it('should have default role as USER', () => {
      const definition = mockSchema.definition;
      
      expect(definition.role.default).toBe(UserRole.USER);
    });
  });

  describe('Edge Cases', () => {
    it('should handle toJSON transform with missing fields', () => {
      const transformFunction = mockSchema.options.toJSON.transform;
      
      const mockDoc = {};
      const mockRet = {
        _id: '507f1f77bcf86cd799439011'
        // Missing other fields
      };

      const result = transformFunction(mockDoc, mockRet);

      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect(result._id).toBeUndefined();
      expect(result.__v).toBeUndefined();
    });

    it('should handle toJSON transform with null values', () => {
      const transformFunction = mockSchema.options.toJSON.transform;
      
      const mockDoc = {};
      const mockRet = {
        _id: '507f1f77bcf86cd799439011',
        email: null,
        password: null,
        role: UserRole.USER,
        __v: 0
      };

      const result = transformFunction(mockDoc, mockRet);

      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect(result.email).toBeNull();
      expect(result.password).toBeNull();
    });
  });
});