import { CatRepository } from '../../../../../src/infrastructure/adapters/repositories/CatRepository';
import { CatApiClient } from '../../../../../src/infrastructure/adapters/api-client/CatApiClient';
import { Breed } from '../../../../../src/domain/entities/Breed';
import { Cat } from '../../../../../src/domain/entities/Cat';

// Mock CatApiClient
jest.mock('../../../../../src/infrastructure/adapters/api-client/CatApiClient');

const MockedCatApiClient = CatApiClient as jest.MockedClass<typeof CatApiClient>;

describe('CatRepository', () => {
  let catRepository: CatRepository;
  let mockCatApiClient: jest.Mocked<CatApiClient>;
  const defaultLimit = 10;

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

  const mockCat: Cat = {
    id: 'MTY3ODIyMQ',
    url: 'https://cdn2.thecatapi.com/images/MTY3ODIyMQ.jpg',
    width: 1204,
    height: 1445,
    breeds: [mockBreed]
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new mock instance
    mockCatApiClient = {
      getBreeds: jest.fn(),
      getBreedById: jest.fn(),
      searchBreeds: jest.fn(),
      getImagesByBreedId: jest.fn()
    } as unknown as jest.Mocked<CatApiClient>;

    // Mock the constructor to return our mock instance
    MockedCatApiClient.mockImplementation(() => mockCatApiClient);
    
    catRepository = new CatRepository(mockCatApiClient);
  });

  describe('getBreeds', () => {
    it('should return all breeds from API client', async () => {
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

      mockCatApiClient.getBreeds.mockResolvedValue(mockBreeds);

      // Act
      const result = await catRepository.getBreeds();

      // Assert
      expect(result).toEqual(mockBreeds);
      expect(mockCatApiClient.getBreeds).toHaveBeenCalledTimes(1);
      expect(mockCatApiClient.getBreeds).toHaveBeenCalledWith();
    });

    it('should return empty array when no breeds available', async () => {
      // Arrange
      mockCatApiClient.getBreeds.mockResolvedValue([]);

      // Act
      const result = await catRepository.getBreeds();

      // Assert
      expect(result).toEqual([]);
      expect(mockCatApiClient.getBreeds).toHaveBeenCalledTimes(1);
    });

    it('should handle API client errors', async () => {
      // Arrange
      const apiError = new Error('API request failed');
      mockCatApiClient.getBreeds.mockRejectedValue(apiError);

      // Act & Assert
      await expect(catRepository.getBreeds()).rejects.toThrow('API request failed');
      expect(mockCatApiClient.getBreeds).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      mockCatApiClient.getBreeds.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(catRepository.getBreeds()).rejects.toThrow('Network timeout');
    });

    it('should handle large number of breeds', async () => {
      // Arrange
      const largeBreedList: Breed[] = Array.from({ length: 100 }, (_, index) => ({
        ...mockBreed,
        id: `breed_${index}`,
        name: `Breed ${index}`
      }));

      mockCatApiClient.getBreeds.mockResolvedValue(largeBreedList);

      // Act
      const result = await catRepository.getBreeds();

      // Assert
      expect(result).toHaveLength(100);
      expect(result[0].id).toBe('breed_0');
      expect(result[99].id).toBe('breed_99');
    });
  });

  describe('getBreedById', () => {
    const testBreedId = 'abys';

    it('should return breed when found by id', async () => {
      // Arrange
      mockCatApiClient.getBreedById.mockResolvedValue(mockBreed);

      // Act
      const result = await catRepository.getBreedById(testBreedId);

      // Assert
      expect(result).toEqual(mockBreed);
      expect(mockCatApiClient.getBreedById).toHaveBeenCalledTimes(1);
      expect(mockCatApiClient.getBreedById).toHaveBeenCalledWith(testBreedId);
    });

    it('should return null when breed not found', async () => {
      // Arrange
      mockCatApiClient.getBreedById.mockResolvedValue(null);

      // Act
      const result = await catRepository.getBreedById('nonexistent');

      // Assert
      expect(result).toBeNull();
      expect(mockCatApiClient.getBreedById).toHaveBeenCalledWith('nonexistent');
    });

    it('should handle invalid breed id format', async () => {
      // Arrange
      const invalidIds = ['', '   ', 'invalid-id-123', '!@#$%'];
      mockCatApiClient.getBreedById.mockResolvedValue(null);

      // Act & Assert
      for (const invalidId of invalidIds) {
        const result = await catRepository.getBreedById(invalidId);
        expect(result).toBeNull();
        expect(mockCatApiClient.getBreedById).toHaveBeenCalledWith(invalidId);
      }
    });

    it('should handle API client errors', async () => {
      // Arrange
      const apiError = new Error('Breed not found');
      mockCatApiClient.getBreedById.mockRejectedValue(apiError);

      // Act & Assert
      await expect(catRepository.getBreedById(testBreedId)).rejects.toThrow('Breed not found');
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

      mockCatApiClient.getBreedById.mockResolvedValue(minimalBreed);

      // Act
      const result = await catRepository.getBreedById('test');

      // Assert
      expect(result).toEqual(minimalBreed);
      expect(result?.wikipedia_url).toBeUndefined();
      expect(result?.reference_image_id).toBeUndefined();
    });
  });

  describe('searchBreeds', () => {
    const testQuery = 'persian';

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

      mockCatApiClient.searchBreeds.mockResolvedValue(searchResults);

      // Act
      const result = await catRepository.searchBreeds(testQuery);

      // Assert
      expect(result).toEqual(searchResults);
      expect(mockCatApiClient.searchBreeds).toHaveBeenCalledTimes(1);
      expect(mockCatApiClient.searchBreeds).toHaveBeenCalledWith(testQuery);
    });

    it('should return empty array when no matches found', async () => {
      // Arrange
      mockCatApiClient.searchBreeds.mockResolvedValue([]);

      // Act
      const result = await catRepository.searchBreeds('nonexistentbreed');

      // Assert
      expect(result).toEqual([]);
      expect(mockCatApiClient.searchBreeds).toHaveBeenCalledWith('nonexistentbreed');
    });

    it('should handle empty search query', async () => {
      // Arrange
      mockCatApiClient.searchBreeds.mockResolvedValue([]);

      // Act
      const result = await catRepository.searchBreeds('');

      // Assert
      expect(result).toEqual([]);
      expect(mockCatApiClient.searchBreeds).toHaveBeenCalledWith('');
    });

    it('should handle special characters in search query', async () => {
      // Arrange
      const specialQueries = ['cat & dog', 'breed@test', 'query with spaces', '中文查询'];
      mockCatApiClient.searchBreeds.mockResolvedValue([]);

      // Act & Assert
      for (const query of specialQueries) {
        const result = await catRepository.searchBreeds(query);
        expect(result).toEqual([]);
        expect(mockCatApiClient.searchBreeds).toHaveBeenCalledWith(query);
      }
    });

    it('should handle case-insensitive searches', async () => {
      // Arrange
      const caseVariations = ['PERSIAN', 'persian', 'Persian', 'pErSiAn'];
      const searchResults: Breed[] = [{
        ...mockBreed,
        id: 'pers',
        name: 'Persian'
      }];

      mockCatApiClient.searchBreeds.mockResolvedValue(searchResults);

      // Act & Assert
      for (const query of caseVariations) {
        const result = await catRepository.searchBreeds(query);
        expect(result).toEqual(searchResults);
        expect(mockCatApiClient.searchBreeds).toHaveBeenCalledWith(query);
      }
    });

    it('should handle API client errors during search', async () => {
      // Arrange
      const searchError = new Error('Search service unavailable');
      mockCatApiClient.searchBreeds.mockRejectedValue(searchError);

      // Act & Assert
      await expect(catRepository.searchBreeds(testQuery)).rejects.toThrow('Search service unavailable');
    });
  });

  describe('getImagesByBreedId', () => {
    const testBreedId = 'abys';
    const defaultLimit = 10;

    it('should return images for breed with default limit', async () => {
      // Arrange
      const mockImages: Cat[] = [
        mockCat,
        {
          id: 'MTY3ODIyMg',
          url: 'https://cdn2.thecatapi.com/images/MTY3ODIyMg.jpg',
          width: 800,
          height: 600,
          breeds: [mockBreed]
        }
      ];

      mockCatApiClient.getImagesByBreedId.mockResolvedValue(mockImages);

      // Act
      const result = await catRepository.getImagesByBreedId(testBreedId);

      // Assert
      expect(result).toEqual(mockImages);
      expect(mockCatApiClient.getImagesByBreedId).toHaveBeenCalledTimes(1);
      expect(mockCatApiClient.getImagesByBreedId).toHaveBeenCalledWith(testBreedId, defaultLimit);
    });

    it('should return images for breed with custom limit', async () => {
      // Arrange
      const customLimit = 5;
      const mockImages: Cat[] = [mockCat];

      mockCatApiClient.getImagesByBreedId.mockResolvedValue(mockImages);

      // Act
      const result = await catRepository.getImagesByBreedId(testBreedId, customLimit);

      // Assert
      expect(result).toEqual(mockImages);
      expect(mockCatApiClient.getImagesByBreedId).toHaveBeenCalledWith(testBreedId, customLimit);
    });

    it('should return empty array when no images found', async () => {
      // Arrange
      mockCatApiClient.getImagesByBreedId.mockResolvedValue([]);

      // Act
      const result = await catRepository.getImagesByBreedId('unknownbreed');

      // Assert
      expect(result).toEqual([]);
      expect(mockCatApiClient.getImagesByBreedId).toHaveBeenCalledWith('unknownbreed', defaultLimit);
    });

    it('should handle different limit values', async () => {
      // Arrange
      const limits = [1, 5, 10, 20, 50, 100];
      mockCatApiClient.getImagesByBreedId.mockResolvedValue([mockCat]);

      // Act & Assert
      for (const limit of limits) {
        const result = await catRepository.getImagesByBreedId(testBreedId, limit);
        expect(result).toEqual([mockCat]);
        expect(mockCatApiClient.getImagesByBreedId).toHaveBeenCalledWith(testBreedId, limit);
      }
    });

    it('should handle zero and negative limits', async () => {
      // Arrange
      const invalidLimits = [0, -1, -10];
      mockCatApiClient.getImagesByBreedId.mockResolvedValue([]);

      // Act & Assert
      for (const limit of invalidLimits) {
        const result = await catRepository.getImagesByBreedId(testBreedId, limit);
        expect(result).toEqual([]);
        expect(mockCatApiClient.getImagesByBreedId).toHaveBeenCalledWith(testBreedId, limit);
      }
    });

    it('should handle images without breed information', async () => {
      // Arrange
      const imageWithoutBreeds: Cat = {
        id: 'MTY3ODIyMw',
        url: 'https://cdn2.thecatapi.com/images/MTY3ODIyMw.jpg',
        width: 1000,
        height: 800
      };

      mockCatApiClient.getImagesByBreedId.mockResolvedValue([imageWithoutBreeds]);

      // Act
      const result = await catRepository.getImagesByBreedId(testBreedId);

      // Assert
      expect(result).toEqual([imageWithoutBreeds]);
      expect(result[0].breeds).toBeUndefined();
    });

    it('should handle API client errors', async () => {
      // Arrange
      const apiError = new Error('Images service unavailable');
      mockCatApiClient.getImagesByBreedId.mockRejectedValue(apiError);

      // Act & Assert
      await expect(catRepository.getImagesByBreedId(testBreedId)).rejects.toThrow('Images service unavailable');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle breed search and image retrieval workflow', async () => {
      // Arrange
      const searchQuery = 'persian';
      const foundBreeds: Breed[] = [{
        ...mockBreed,
        id: 'pers',
        name: 'Persian'
      }];
      const breedImages: Cat[] = [mockCat];

      mockCatApiClient.searchBreeds.mockResolvedValue(foundBreeds);
      mockCatApiClient.getImagesByBreedId.mockResolvedValue(breedImages);

      // Act
      const searchResults = await catRepository.searchBreeds(searchQuery);
      const images = await catRepository.getImagesByBreedId(searchResults[0].id);

      // Assert
      expect(searchResults).toEqual(foundBreeds);
      expect(images).toEqual(breedImages);
      expect(mockCatApiClient.searchBreeds).toHaveBeenCalledWith(searchQuery);
      expect(mockCatApiClient.getImagesByBreedId).toHaveBeenCalledWith('pers', defaultLimit);
    });

    it('should handle concurrent API calls gracefully', async () => {
      // Arrange
      mockCatApiClient.getBreeds.mockResolvedValue([mockBreed]);
      mockCatApiClient.getBreedById.mockResolvedValue(mockBreed);
      mockCatApiClient.searchBreeds.mockResolvedValue([mockBreed]);
      mockCatApiClient.getImagesByBreedId.mockResolvedValue([mockCat]);

      // Act - Simulate concurrent operations
      const promises = [
        catRepository.getBreeds(),
        catRepository.getBreedById('abys'),
        catRepository.searchBreeds('abyssinian'),
        catRepository.getImagesByBreedId('abys', 5)
      ];

      const results = await Promise.all(promises);

      // Assert
      expect(results[0]).toEqual([mockBreed]); // getBreeds
      expect(results[1]).toEqual(mockBreed);   // getBreedById
      expect(results[2]).toEqual([mockBreed]); // searchBreeds
      expect(results[3]).toEqual([mockCat]);   // getImagesByBreedId
    });
  });

  describe('Edge Cases', () => {
    it('should handle null responses from API client', async () => {
      // Arrange
      mockCatApiClient.getBreeds.mockResolvedValue(null as any);
      mockCatApiClient.searchBreeds.mockResolvedValue(null as any);
      mockCatApiClient.getImagesByBreedId.mockResolvedValue(null as any);

      // Act & Assert
      const breedsResult = await catRepository.getBreeds();
      const searchResult = await catRepository.searchBreeds('test');
      const imagesResult = await catRepository.getImagesByBreedId('test');

      expect(breedsResult).toBeNull();
      expect(searchResult).toBeNull();
      expect(imagesResult).toBeNull();
    });

    it('should handle undefined responses from API client', async () => {
      // Arrange
      mockCatApiClient.getBreeds.mockResolvedValue(undefined as any);
      mockCatApiClient.searchBreeds.mockResolvedValue(undefined as any);
      mockCatApiClient.getImagesByBreedId.mockResolvedValue(undefined as any);

      // Act & Assert
      const breedsResult = await catRepository.getBreeds();
      const searchResult = await catRepository.searchBreeds('test');
      const imagesResult = await catRepository.getImagesByBreedId('test');

      expect(breedsResult).toBeUndefined();
      expect(searchResult).toBeUndefined();
      expect(imagesResult).toBeUndefined();
    });

    it('should handle malformed data from API client', async () => {
      // Arrange
      const malformedBreed = {
        id: 'test',
        // Missing required fields
      };

      mockCatApiClient.getBreeds.mockResolvedValue([malformedBreed as any]);
      mockCatApiClient.getBreedById.mockResolvedValue(malformedBreed as any);

      // Act
      const breedsResult = await catRepository.getBreeds();
      const breedResult = await catRepository.getBreedById('test');

      // Assert
      expect(breedsResult).toEqual([malformedBreed]);
      expect(breedResult).toEqual(malformedBreed);
    });

    it('should handle very long breed IDs and search queries', async () => {
      // Arrange
      const longId = 'a'.repeat(1000);
      const longQuery = 'search query '.repeat(100);

      mockCatApiClient.getBreedById.mockResolvedValue(null);
      mockCatApiClient.searchBreeds.mockResolvedValue([]);
      mockCatApiClient.getImagesByBreedId.mockResolvedValue([]);

      // Act & Assert
      const breedResult = await catRepository.getBreedById(longId);
      const searchResult = await catRepository.searchBreeds(longQuery);
      const imagesResult = await catRepository.getImagesByBreedId(longId);

      expect(breedResult).toBeNull();
      expect(searchResult).toEqual([]);
      expect(imagesResult).toEqual([]);
      expect(mockCatApiClient.getBreedById).toHaveBeenCalledWith(longId);
      expect(mockCatApiClient.searchBreeds).toHaveBeenCalledWith(longQuery);
      expect(mockCatApiClient.getImagesByBreedId).toHaveBeenCalledWith(longId, defaultLimit);
    });
  });
});