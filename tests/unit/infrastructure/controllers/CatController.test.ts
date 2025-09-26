import { Request, Response, NextFunction } from 'express';
import { CatController } from '../../../../src/infrastructure/controllers/CatController';
import { GetBreeds } from '../../../../src/application/use-cases/cats/GetBreeds';
import { GetBreedById } from '../../../../src/application/use-cases/cats/GetBreedById';
import { SearchBreeds } from '../../../../src/application/use-cases/cats/SearchBreeds';
import { Breed } from '../../../../src/domain/entities/Breed';

// Mock the use cases
jest.mock('../../../../src/application/use-cases/cats/GetBreeds');
jest.mock('../../../../src/application/use-cases/cats/GetBreedById');
jest.mock('../../../../src/application/use-cases/cats/SearchBreeds');

const MockedGetBreeds = GetBreeds as jest.MockedClass<typeof GetBreeds>;
const MockedGetBreedById = GetBreedById as jest.MockedClass<typeof GetBreedById>;
const MockedSearchBreeds = SearchBreeds as jest.MockedClass<typeof SearchBreeds>;

describe('CatController', () => {
  let catController: CatController;
  let mockGetBreedsUseCase: jest.Mocked<GetBreeds>;
  let mockGetBreedByIdUseCase: jest.Mocked<GetBreedById>;
  let mockSearchBreedsUseCase: jest.Mocked<SearchBreeds>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockBreed: Breed = {
    id: 'abys',
    name: 'Abyssinian',
    description: 'The Abyssinian is easy to care for, and a joy to have in your home.',
    temperament: 'Active, Energetic, Independent, Intelligent, Gentle',
    origin: 'Egypt',
    life_span: '14 - 15',
    weight: {
      imperial: '7  -  10',
      metric: '3 - 5'
    },
    wikipedia_url: 'https://en.wikipedia.org/wiki/Abyssinian_cat',
    reference_image_id: '0XYvRd7oD'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock use case instances
    mockGetBreedsUseCase = {
      execute: jest.fn()
    } as unknown as jest.Mocked<GetBreeds>;

    mockGetBreedByIdUseCase = {
      execute: jest.fn()
    } as unknown as jest.Mocked<GetBreedById>;

    mockSearchBreedsUseCase = {
      execute: jest.fn()
    } as unknown as jest.Mocked<SearchBreeds>;

    // Mock the constructors to return our mock instances
    MockedGetBreeds.mockImplementation(() => mockGetBreedsUseCase);
    MockedGetBreedById.mockImplementation(() => mockGetBreedByIdUseCase);
    MockedSearchBreeds.mockImplementation(() => mockSearchBreedsUseCase);

    // Create controller instance
    catController = new CatController(
      mockGetBreedsUseCase,
      mockGetBreedByIdUseCase,
      mockSearchBreedsUseCase
    );

    // Create mock Express objects
    mockRequest = {};
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('getBreeds', () => {
    it('should return all breeds successfully', async () => {
      // Arrange
      const mockBreeds: Breed[] = [
        mockBreed,
        {
          id: 'aege',
          name: 'Aegean',
          description: 'Native to the Greek islands known as the Cyclades in the Aegean Sea.',
          temperament: 'Affectionate, Social, Intelligent, Playful, Active',
          origin: 'Greece',
          life_span: '9 - 12',
          weight: {
            imperial: '7 - 10',
            metric: '3 - 5'
          }
        }
      ];

      mockGetBreedsUseCase.execute.mockResolvedValue(mockBreeds);

      // Act
      await catController.getBreeds(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetBreedsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockGetBreedsUseCase.execute).toHaveBeenCalledWith();
      expect(mockResponse.json).toHaveBeenCalledWith(mockBreeds);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return empty array when no breeds available', async () => {
      // Arrange
      mockGetBreedsUseCase.execute.mockResolvedValue([]);

      // Act
      await catController.getBreeds(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetBreedsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle use case errors by calling next', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockGetBreedsUseCase.execute.mockRejectedValue(error);

      // Act
      await catController.getBreeds(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetBreedsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockGetBreedsUseCase.execute.mockRejectedValue(timeoutError);

      // Act
      await catController.getBreeds(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(timeoutError);
    });

    it('should handle large datasets', async () => {
      // Arrange
      const largeBreedList: Breed[] = Array.from({ length: 100 }, (_, index) => ({
        ...mockBreed,
        id: `breed_${index}`,
        name: `Breed ${index}`
      }));

      mockGetBreedsUseCase.execute.mockResolvedValue(largeBreedList);

      // Act
      await catController.getBreeds(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(largeBreedList);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('getBreedById', () => {
    const testBreedId = 'abys';

    beforeEach(() => {
      mockRequest.params = { breed_id: testBreedId };
    });

    it('should return breed when found by id', async () => {
      // Arrange
      mockGetBreedByIdUseCase.execute.mockResolvedValue(mockBreed);

      // Act
      await catController.getBreedById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetBreedByIdUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockGetBreedByIdUseCase.execute).toHaveBeenCalledWith(testBreedId);
      expect(mockResponse.json).toHaveBeenCalledWith(mockBreed);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 when breed not found', async () => {
      // Arrange
      mockGetBreedByIdUseCase.execute.mockResolvedValue(null);

      // Act
      await catController.getBreedById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetBreedByIdUseCase.execute).toHaveBeenCalledWith(testBreedId);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Raza no encontrada' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle invalid breed id formats', async () => {
      // Arrange
      const invalidIds = ['', '   ', 'invalid-id-123', '!@#$%'];
      
      for (const invalidId of invalidIds) {
        jest.clearAllMocks();
        mockRequest.params = { breed_id: invalidId };
        mockGetBreedByIdUseCase.execute.mockResolvedValue(null);

        // Act
        await catController.getBreedById(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        // Assert
        expect(mockGetBreedByIdUseCase.execute).toHaveBeenCalledWith(invalidId);
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Raza no encontrada' });
      }
    });

    it('should handle missing breed_id parameter', async () => {
      // Arrange
      mockRequest.params = {};
      mockGetBreedByIdUseCase.execute.mockResolvedValue(null);

      // Act
      await catController.getBreedById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetBreedByIdUseCase.execute).toHaveBeenCalledWith(undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Raza no encontrada' });
    });

    it('should handle use case errors by calling next', async () => {
      // Arrange
      const error = new Error('Breed service unavailable');
      mockGetBreedByIdUseCase.execute.mockRejectedValue(error);

      // Act
      await catController.getBreedById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetBreedByIdUseCase.execute).toHaveBeenCalledWith(testBreedId);
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle different breed structures', async () => {
      // Arrange
      const minimalBreed: Breed = {
        id: 'test',
        name: 'Test Breed',
        description: 'Test description',
        temperament: 'Calm',
        origin: 'Unknown',
        life_span: '10 - 15',
        weight: {
          imperial: '5 - 8',
          metric: '2 - 4'
        }
      };

      mockGetBreedByIdUseCase.execute.mockResolvedValue(minimalBreed);

      // Act
      await catController.getBreedById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(minimalBreed);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('searchBreeds', () => {
    const testQuery = 'persian';

    beforeEach(() => {
      mockRequest.query = { q: testQuery };
    });

    it('should return matching breeds for search query', async () => {
      // Arrange
      const searchResults: Breed[] = [
        {
          ...mockBreed,
          id: 'pers',
          name: 'Persian',
          origin: 'Iran'
        }
      ];

      mockSearchBreedsUseCase.execute.mockResolvedValue(searchResults);

      // Act
      await catController.searchBreeds(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockSearchBreedsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockSearchBreedsUseCase.execute).toHaveBeenCalledWith(testQuery);
      expect(mockResponse.json).toHaveBeenCalledWith(searchResults);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return empty array when no matches found', async () => {
      // Arrange
      mockSearchBreedsUseCase.execute.mockResolvedValue([]);

      // Act
      await catController.searchBreeds(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockSearchBreedsUseCase.execute).toHaveBeenCalledWith(testQuery);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty search query', async () => {
      // Arrange
      mockRequest.query = { q: '' };
      mockSearchBreedsUseCase.execute.mockResolvedValue([]);

      // Act
      await catController.searchBreeds(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockSearchBreedsUseCase.execute).toHaveBeenCalledWith('');
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it('should handle missing query parameter', async () => {
      // Arrange
      mockRequest.query = {};
      mockSearchBreedsUseCase.execute.mockResolvedValue([]);

      // Act
      await catController.searchBreeds(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockSearchBreedsUseCase.execute).toHaveBeenCalledWith(undefined);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it('should handle special characters in search query', async () => {
      // Arrange
      const specialQueries = ['cat & dog', 'breed@test', 'query with spaces', '中文查询'];
      mockSearchBreedsUseCase.execute.mockResolvedValue([]);

      for (const query of specialQueries) {
        jest.clearAllMocks();
        mockRequest.query = { q: query };

        // Act
        await catController.searchBreeds(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        // Assert
        expect(mockSearchBreedsUseCase.execute).toHaveBeenCalledWith(query);
        expect(mockResponse.json).toHaveBeenCalledWith([]);
      }
    });

    it('should handle array query parameters', async () => {
      // Arrange
      mockRequest.query = { q: ['persian', 'siamese'] };
      mockSearchBreedsUseCase.execute.mockResolvedValue([]);

      // Act
      await catController.searchBreeds(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      // Express query arrays are cast to string by the controller
      expect(mockSearchBreedsUseCase.execute).toHaveBeenCalledWith(['persian', 'siamese'] as any);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it('should handle numeric query parameters', async () => {
      // Arrange
      mockRequest.query = { q: '123' };
      mockSearchBreedsUseCase.execute.mockResolvedValue([]);

      // Act
      await catController.searchBreeds(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockSearchBreedsUseCase.execute).toHaveBeenCalledWith('123');
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it('should handle use case errors by calling next', async () => {
      // Arrange
      const error = new Error('Search service unavailable');
      mockSearchBreedsUseCase.execute.mockRejectedValue(error);

      // Act
      await catController.searchBreeds(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockSearchBreedsUseCase.execute).toHaveBeenCalledWith(testQuery);
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle case-insensitive searches', async () => {
      // Arrange
      const caseVariations = ['PERSIAN', 'persian', 'Persian', 'pErSiAn'];
      const searchResults: Breed[] = [{
        ...mockBreed,
        id: 'pers',
        name: 'Persian'
      }];

      mockSearchBreedsUseCase.execute.mockResolvedValue(searchResults);

      for (const query of caseVariations) {
        jest.clearAllMocks();
        mockRequest.query = { q: query };

        // Act
        await catController.searchBreeds(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        // Assert
        expect(mockSearchBreedsUseCase.execute).toHaveBeenCalledWith(query);
        expect(mockResponse.json).toHaveBeenCalledWith(searchResults);
      }
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle multiple concurrent requests', async () => {
      // Arrange
      const mockBreeds = [mockBreed];
      mockGetBreedsUseCase.execute.mockResolvedValue(mockBreeds);
      mockGetBreedByIdUseCase.execute.mockResolvedValue(mockBreed);
      mockSearchBreedsUseCase.execute.mockResolvedValue(mockBreeds);

      mockRequest.params = { breed_id: 'abys' };
      mockRequest.query = { q: 'abyssinian' };

      // Act - Simulate concurrent operations
      const promises = [
        catController.getBreeds(mockRequest as Request, mockResponse as Response, mockNext),
        catController.getBreedById(mockRequest as Request, mockResponse as Response, mockNext),
        catController.searchBreeds(mockRequest as Request, mockResponse as Response, mockNext)
      ];

      await Promise.all(promises);

      // Assert
      expect(mockGetBreedsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockGetBreedByIdUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockSearchBreedsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledTimes(3);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle mixed success and error scenarios', async () => {
      // Arrange
      const error = new Error('Service error');
      mockGetBreedsUseCase.execute.mockResolvedValue([mockBreed]);
      mockGetBreedByIdUseCase.execute.mockRejectedValue(error);
      mockSearchBreedsUseCase.execute.mockResolvedValue([]);

      mockRequest.params = { breed_id: 'abys' };
      mockRequest.query = { q: 'test' };

      // Act
      await catController.getBreeds(mockRequest as Request, mockResponse as Response, mockNext);
      await catController.getBreedById(mockRequest as Request, mockResponse as Response, mockNext);
      await catController.searchBreeds(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledTimes(2); // getBreeds and searchBreeds
      expect(mockNext).toHaveBeenCalledTimes(1); // getBreedById error
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null responses from use cases', async () => {
      // Arrange
      mockRequest.query = { q: 'test' }; // Provide valid query to avoid destructuring error
      mockGetBreedsUseCase.execute.mockResolvedValue(null as any);
      mockSearchBreedsUseCase.execute.mockResolvedValue(null as any);

      // Act
      await catController.getBreeds(mockRequest as Request, mockResponse as Response, mockNext);
      await catController.searchBreeds(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(null);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle undefined responses from use cases', async () => {
      // Arrange
      mockRequest.query = { q: 'test' }; // Provide valid query to avoid destructuring error
      mockGetBreedsUseCase.execute.mockResolvedValue(undefined as any);
      mockSearchBreedsUseCase.execute.mockResolvedValue(undefined as any);

      // Act
      await catController.getBreeds(mockRequest as Request, mockResponse as Response, mockNext);
      await catController.searchBreeds(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(undefined);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed request objects', async () => {
      // Arrange
      const malformedRequest = {
        params: null,
        query: null
      } as any;

      // Act
      await catController.getBreedById(malformedRequest, mockResponse as Response, mockNext);
      await catController.searchBreeds(malformedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(2);
      expect(mockNext).toHaveBeenNthCalledWith(1, expect.any(TypeError));
      expect(mockNext).toHaveBeenNthCalledWith(2, expect.any(TypeError));
    });

    it('should handle very long breed IDs and search queries', async () => {
      // Arrange
      const longId = 'a'.repeat(1000);
      const longQuery = 'search query '.repeat(100);

      mockRequest.params = { breed_id: longId };
      mockRequest.query = { q: longQuery };

      mockGetBreedByIdUseCase.execute.mockResolvedValue(null);
      mockSearchBreedsUseCase.execute.mockResolvedValue([]);

      // Act
      await catController.getBreedById(mockRequest as Request, mockResponse as Response, mockNext);
      await catController.searchBreeds(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockGetBreedByIdUseCase.execute).toHaveBeenCalledWith(longId);
      expect(mockSearchBreedsUseCase.execute).toHaveBeenCalledWith(longQuery);
      expect(mockResponse.status).toHaveBeenCalledWith(404); // getBreedById returns null
      expect(mockResponse.json).toHaveBeenCalledWith([]); // searchBreeds returns empty
    });

    it('should handle response object errors', async () => {
      // Arrange
      const responseError = new Error('Response write error');
      mockResponse.json = jest.fn().mockImplementation(() => {
        throw responseError;
      });
      mockGetBreedsUseCase.execute.mockResolvedValue([mockBreed]);

      // Act
      await catController.getBreeds(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(responseError);
    });
  });
});