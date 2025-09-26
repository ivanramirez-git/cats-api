import { ICatRepository } from '../../../../src/domain/repositories/ICatRepository';
import { Breed } from '../../../../src/domain/entities/Breed';
import { Cat } from '../../../../src/domain/entities/Cat';

describe('ICatRepository Interface', () => {
  let mockRepository: jest.Mocked<ICatRepository>;

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

  const mockBreeds: Breed[] = [
    mockBreed,
    {
      id: 'beng',
      name: 'Bengal',
      description: 'Bengals are a lot of fun to live with.',
      temperament: 'Alert, Agile, Energetic, Demanding, Intelligent',
      origin: 'United States',
      life_span: '14 - 16',
      weight: {
        imperial: '12 - 22',
        metric: '5 - 10'
      }
    }
  ];

  const mockCat: Cat = {
    id: 'img1',
    url: 'https://example.com/cat1.jpg',
    width: 800,
    height: 600,
    breeds: [mockBreed]
  };

  const mockCats: Cat[] = [
    mockCat,
    {
      id: 'img2',
      url: 'https://example.com/cat2.jpg',
      width: 1024,
      height: 768,
      breeds: []
    }
  ];

  beforeEach(() => {
    mockRepository = {
      getBreeds: jest.fn(),
      getBreedById: jest.fn(),
      searchBreeds: jest.fn(),
      getImagesByBreedId: jest.fn()
    };
  });

  describe('Interface Structure', () => {
    it('should have all required methods', () => {
      expect(mockRepository).toHaveProperty('getBreeds');
      expect(mockRepository).toHaveProperty('getBreedById');
      expect(mockRepository).toHaveProperty('searchBreeds');
      expect(mockRepository).toHaveProperty('getImagesByBreedId');
    });

    it('should have methods as functions', () => {
      expect(typeof mockRepository.getBreeds).toBe('function');
      expect(typeof mockRepository.getBreedById).toBe('function');
      expect(typeof mockRepository.searchBreeds).toBe('function');
      expect(typeof mockRepository.getImagesByBreedId).toBe('function');
    });
  });

  describe('getBreeds method', () => {
    it('should return a Promise of Breed array', async () => {
      // Arrange
      mockRepository.getBreeds.mockResolvedValue(mockBreeds);

      // Act
      const result = await mockRepository.getBreeds();

      // Assert
      expect(mockRepository.getBreeds).toHaveBeenCalledTimes(1);
      expect(mockRepository.getBreeds).toHaveBeenCalledWith();
      expect(result).toEqual(mockBreeds);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no breeds available', async () => {
      // Arrange
      mockRepository.getBreeds.mockResolvedValue([]);

      // Act
      const result = await mockRepository.getBreeds();

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle errors properly', async () => {
      // Arrange
      const error = new Error('Network error');
      mockRepository.getBreeds.mockRejectedValue(error);

      // Act & Assert
      await expect(mockRepository.getBreeds()).rejects.toThrow('Network error');
    });
  });

  describe('getBreedById method', () => {
    it('should accept string parameter and return Promise of Breed or null', async () => {
      // Arrange
      const breedId = 'abys';
      mockRepository.getBreedById.mockResolvedValue(mockBreed);

      // Act
      const result = await mockRepository.getBreedById(breedId);

      // Assert
      expect(mockRepository.getBreedById).toHaveBeenCalledTimes(1);
      expect(mockRepository.getBreedById).toHaveBeenCalledWith(breedId);
      expect(result).toEqual(mockBreed);
    });

    it('should return null when breed not found', async () => {
      // Arrange
      const breedId = 'nonexistent';
      mockRepository.getBreedById.mockResolvedValue(null);

      // Act
      const result = await mockRepository.getBreedById(breedId);

      // Assert
      expect(mockRepository.getBreedById).toHaveBeenCalledWith(breedId);
      expect(result).toBeNull();
    });

    it('should handle empty string parameter', async () => {
      // Arrange
      const breedId = '';
      mockRepository.getBreedById.mockResolvedValue(null);

      // Act
      const result = await mockRepository.getBreedById(breedId);

      // Assert
      expect(mockRepository.getBreedById).toHaveBeenCalledWith(breedId);
      expect(result).toBeNull();
    });

    it('should handle errors properly', async () => {
      // Arrange
      const breedId = 'abys';
      const error = new Error('Database error');
      mockRepository.getBreedById.mockRejectedValue(error);

      // Act & Assert
      await expect(mockRepository.getBreedById(breedId)).rejects.toThrow('Database error');
    });
  });

  describe('searchBreeds method', () => {
    it('should accept string query and return Promise of Breed array', async () => {
      // Arrange
      const query = 'active';
      const filteredBreeds = [mockBreed];
      mockRepository.searchBreeds.mockResolvedValue(filteredBreeds);

      // Act
      const result = await mockRepository.searchBreeds(query);

      // Assert
      expect(mockRepository.searchBreeds).toHaveBeenCalledTimes(1);
      expect(mockRepository.searchBreeds).toHaveBeenCalledWith(query);
      expect(result).toEqual(filteredBreeds);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no matches found', async () => {
      // Arrange
      const query = 'nonexistent';
      mockRepository.searchBreeds.mockResolvedValue([]);

      // Act
      const result = await mockRepository.searchBreeds(query);

      // Assert
      expect(mockRepository.searchBreeds).toHaveBeenCalledWith(query);
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle empty string query', async () => {
      // Arrange
      const query = '';
      mockRepository.searchBreeds.mockResolvedValue(mockBreeds);

      // Act
      const result = await mockRepository.searchBreeds(query);

      // Assert
      expect(mockRepository.searchBreeds).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockBreeds);
    });

    it('should handle special characters in query', async () => {
      // Arrange
      const query = 'cat-breed_123';
      mockRepository.searchBreeds.mockResolvedValue([]);

      // Act
      const result = await mockRepository.searchBreeds(query);

      // Assert
      expect(mockRepository.searchBreeds).toHaveBeenCalledWith(query);
      expect(result).toEqual([]);
    });

    it('should handle errors properly', async () => {
      // Arrange
      const query = 'active';
      const error = new Error('Search error');
      mockRepository.searchBreeds.mockRejectedValue(error);

      // Act & Assert
      await expect(mockRepository.searchBreeds(query)).rejects.toThrow('Search error');
    });
  });

  describe('getImagesByBreedId method', () => {
    it('should accept breedId string and return Promise of Cat array', async () => {
      // Arrange
      const breedId = 'abys';
      mockRepository.getImagesByBreedId.mockResolvedValue(mockCats);

      // Act
      const result = await mockRepository.getImagesByBreedId(breedId);

      // Assert
      expect(mockRepository.getImagesByBreedId).toHaveBeenCalledTimes(1);
      expect(mockRepository.getImagesByBreedId).toHaveBeenCalledWith(breedId);
      expect(result).toEqual(mockCats);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should accept optional limit parameter', async () => {
      // Arrange
      const breedId = 'abys';
      const limit = 5;
      const limitedCats = [mockCat];
      mockRepository.getImagesByBreedId.mockResolvedValue(limitedCats);

      // Act
      const result = await mockRepository.getImagesByBreedId(breedId, limit);

      // Assert
      expect(mockRepository.getImagesByBreedId).toHaveBeenCalledWith(breedId, limit);
      expect(result).toEqual(limitedCats);
      expect(result.length).toBeLessThanOrEqual(limit);
    });

    it('should work without limit parameter (undefined)', async () => {
      // Arrange
      const breedId = 'abys';
      mockRepository.getImagesByBreedId.mockResolvedValue(mockCats);

      // Act
      const result = await mockRepository.getImagesByBreedId(breedId, undefined);

      // Assert
      expect(mockRepository.getImagesByBreedId).toHaveBeenCalledWith(breedId, undefined);
      expect(result).toEqual(mockCats);
    });

    it('should handle zero limit', async () => {
      // Arrange
      const breedId = 'abys';
      const limit = 0;
      mockRepository.getImagesByBreedId.mockResolvedValue([]);

      // Act
      const result = await mockRepository.getImagesByBreedId(breedId, limit);

      // Assert
      expect(mockRepository.getImagesByBreedId).toHaveBeenCalledWith(breedId, limit);
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should handle negative limit', async () => {
      // Arrange
      const breedId = 'abys';
      const limit = -1;
      mockRepository.getImagesByBreedId.mockResolvedValue([]);

      // Act
      const result = await mockRepository.getImagesByBreedId(breedId, limit);

      // Assert
      expect(mockRepository.getImagesByBreedId).toHaveBeenCalledWith(breedId, limit);
      expect(result).toEqual([]);
    });

    it('should return empty array when no images found', async () => {
      // Arrange
      const breedId = 'nonexistent';
      mockRepository.getImagesByBreedId.mockResolvedValue([]);

      // Act
      const result = await mockRepository.getImagesByBreedId(breedId);

      // Assert
      expect(mockRepository.getImagesByBreedId).toHaveBeenCalledWith(breedId);
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle errors properly', async () => {
      // Arrange
      const breedId = 'abys';
      const error = new Error('Image fetch error');
      mockRepository.getImagesByBreedId.mockRejectedValue(error);

      // Act & Assert
      await expect(mockRepository.getImagesByBreedId(breedId)).rejects.toThrow('Image fetch error');
    });
  });

  describe('Method Signatures and Types', () => {
    it('should verify getBreeds method signature', () => {
      expect(mockRepository.getBreeds).toBeDefined();
      expect(typeof mockRepository.getBreeds).toBe('function');
    });

    it('should verify getBreedById method signature', () => {
      expect(mockRepository.getBreedById).toBeDefined();
      expect(typeof mockRepository.getBreedById).toBe('function');
    });

    it('should verify searchBreeds method signature', () => {
      expect(mockRepository.searchBreeds).toBeDefined();
      expect(typeof mockRepository.searchBreeds).toBe('function');
    });

    it('should verify getImagesByBreedId method signature', () => {
      expect(mockRepository.getImagesByBreedId).toBeDefined();
      expect(typeof mockRepository.getImagesByBreedId).toBe('function');
    });
  });

  describe('Return Type Validation', () => {
    it('should return correct types for all methods', async () => {
      // Arrange
      mockRepository.getBreeds.mockResolvedValue(mockBreeds);
      mockRepository.getBreedById.mockResolvedValue(mockBreed);
      mockRepository.searchBreeds.mockResolvedValue(mockBreeds);
      mockRepository.getImagesByBreedId.mockResolvedValue(mockCats);

      // Act
      const breedsResult = await mockRepository.getBreeds();
      const breedResult = await mockRepository.getBreedById('abys');
      const searchResult = await mockRepository.searchBreeds('active');
      const imagesResult = await mockRepository.getImagesByBreedId('abys');

      // Assert
      expect(Array.isArray(breedsResult)).toBe(true);
      expect(breedResult).toHaveProperty('id');
      expect(breedResult).toHaveProperty('name');
      expect(Array.isArray(searchResult)).toBe(true);
      expect(Array.isArray(imagesResult)).toBe(true);
    });

    it('should handle null return from getBreedById', async () => {
      // Arrange
      mockRepository.getBreedById.mockResolvedValue(null);

      // Act
      const result = await mockRepository.getBreedById('nonexistent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle multiple method calls in sequence', async () => {
      // Arrange
      mockRepository.getBreeds.mockResolvedValue(mockBreeds);
      mockRepository.getBreedById.mockResolvedValue(mockBreed);
      mockRepository.searchBreeds.mockResolvedValue([mockBreed]);
      mockRepository.getImagesByBreedId.mockResolvedValue(mockCats);

      // Act
      const breeds = await mockRepository.getBreeds();
      const breed = await mockRepository.getBreedById('abys');
      const searchResults = await mockRepository.searchBreeds('active');
      const images = await mockRepository.getImagesByBreedId('abys', 5);

      // Assert
      expect(mockRepository.getBreeds).toHaveBeenCalledTimes(1);
      expect(mockRepository.getBreedById).toHaveBeenCalledTimes(1);
      expect(mockRepository.searchBreeds).toHaveBeenCalledTimes(1);
      expect(mockRepository.getImagesByBreedId).toHaveBeenCalledTimes(1);
      expect(breeds).toEqual(mockBreeds);
      expect(breed).toEqual(mockBreed);
      expect(searchResults).toEqual([mockBreed]);
      expect(images).toEqual(mockCats);
    });

    it('should handle concurrent method calls', async () => {
      // Arrange
      mockRepository.getBreeds.mockResolvedValue(mockBreeds);
      mockRepository.getBreedById.mockResolvedValue(mockBreed);
      mockRepository.searchBreeds.mockResolvedValue([mockBreed]);
      mockRepository.getImagesByBreedId.mockResolvedValue(mockCats);

      // Act
      const [breeds, breed, searchResults, images] = await Promise.all([
        mockRepository.getBreeds(),
        mockRepository.getBreedById('abys'),
        mockRepository.searchBreeds('active'),
        mockRepository.getImagesByBreedId('abys')
      ]);

      // Assert
      expect(breeds).toEqual(mockBreeds);
      expect(breed).toEqual(mockBreed);
      expect(searchResults).toEqual([mockBreed]);
      expect(images).toEqual(mockCats);
    });
  });
});