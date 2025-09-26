import { GetBreedById } from '../../../../../src/application/use-cases/cats/GetBreedById';
import { ICatRepository } from '../../../../../src/domain/repositories/ICatRepository';
import { Breed } from '../../../../../src/domain/entities/Breed';
import { Cat } from '../../../../../src/domain/entities/Cat';

// Mock CatRepository
class MockCatRepository implements ICatRepository {
  private breeds: Breed[] = [];

  async getBreeds(): Promise<Breed[]> {
    return [...this.breeds];
  }

  async getBreedById(breedId: string): Promise<Breed | null> {
    return this.breeds.find(breed => breed.id === breedId) || null;
  }

  async searchBreeds(query: string): Promise<Breed[]> {
    return this.breeds.filter(breed => 
      breed.name.toLowerCase().includes(query.toLowerCase()) ||
      breed.description?.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getImagesByBreedId(breedId: string): Promise<Cat[]> {
    return [];
  }

  // Helper method for testing
  setBreeds(breeds: Breed[]): void {
    this.breeds = [...breeds];
  }
}

describe('GetBreedById Use Case', () => {
  let getBreedById: GetBreedById;
  let mockCatRepository: MockCatRepository;
  let sampleBreeds: Breed[];

  beforeEach(() => {
    mockCatRepository = new MockCatRepository();
    getBreedById = new GetBreedById(mockCatRepository);
    
    sampleBreeds = [
      {
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
      },
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
        },
        wikipedia_url: 'https://en.wikipedia.org/wiki/Aegean_cat',
        reference_image_id: 'ozEvzdVM-'
      },
      {
        id: 'beng',
        name: 'Bengal',
        description: 'Bengals are a lot of fun to live with, but they\'re definitely not the cat for everyone.',
        temperament: 'Alert, Agile, Energetic, Demanding, Intelligent',
        origin: 'United States',
        life_span: '10 - 16',
        weight: {
          imperial: '8 - 15',
          metric: '4 - 7'
        },
        wikipedia_url: 'https://en.wikipedia.org/wiki/Bengal_cat',
        reference_image_id: 'O3btzLlsO'
      }
    ];

    mockCatRepository.setBreeds(sampleBreeds);
  });

  describe('Successful execution', () => {
    it('should return breed when valid ID is provided', async () => {
      const result = await getBreedById.execute('abys');
      
      expect(result).not.toBeNull();
      expect(result).toEqual(sampleBreeds[0]);
      expect(result?.id).toBe('abys');
      expect(result?.name).toBe('Abyssinian');
    });

    it('should return correct breed for different valid IDs', async () => {
      const aegeanResult = await getBreedById.execute('aege');
      const bengalResult = await getBreedById.execute('beng');
      
      expect(aegeanResult?.id).toBe('aege');
      expect(aegeanResult?.name).toBe('Aegean');
      expect(aegeanResult?.origin).toBe('Greece');
      
      expect(bengalResult?.id).toBe('beng');
      expect(bengalResult?.name).toBe('Bengal');
      expect(bengalResult?.origin).toBe('United States');
    });

    it('should return breed with complete data structure', async () => {
      const result = await getBreedById.execute('abys');
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('temperament');
      expect(result).toHaveProperty('origin');
      expect(result).toHaveProperty('life_span');
      expect(result).toHaveProperty('weight');
      expect(result?.weight).toHaveProperty('imperial');
      expect(result?.weight).toHaveProperty('metric');
      expect(result).toHaveProperty('wikipedia_url');
      expect(result).toHaveProperty('reference_image_id');
    });
  });

  describe('Not found cases', () => {
    it('should return null when breed ID does not exist', async () => {
      const result = await getBreedById.execute('nonexistent');
      
      expect(result).toBeNull();
    });

    it('should return null for empty string ID', async () => {
      const result = await getBreedById.execute('');
      
      expect(result).toBeNull();
    });

    it('should return null when repository is empty', async () => {
      mockCatRepository.setBreeds([]);
      
      const result = await getBreedById.execute('abys');
      
      expect(result).toBeNull();
    });

    it('should return null for case-sensitive ID mismatch', async () => {
      const result = await getBreedById.execute('ABYS'); // uppercase
      
      expect(result).toBeNull();
    });
  });

  describe('Repository integration', () => {
    it('should call catRepository.getBreedById with correct parameter', async () => {
      const getBreedByIdSpy = jest.spyOn(mockCatRepository, 'getBreedById');
      
      await getBreedById.execute('abys');
      
      expect(getBreedByIdSpy).toHaveBeenCalledWith('abys');
      expect(getBreedByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should pass through different ID parameters correctly', async () => {
      const getBreedByIdSpy = jest.spyOn(mockCatRepository, 'getBreedById');
      
      await getBreedById.execute('aege');
      await getBreedById.execute('beng');
      await getBreedById.execute('nonexistent');
      
      expect(getBreedByIdSpy).toHaveBeenNthCalledWith(1, 'aege');
      expect(getBreedByIdSpy).toHaveBeenNthCalledWith(2, 'beng');
      expect(getBreedByIdSpy).toHaveBeenNthCalledWith(3, 'nonexistent');
      expect(getBreedByIdSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Return value', () => {
    it('should return Promise<Breed | null>', async () => {
      const existingResult = getBreedById.execute('abys');
      const nonExistingResult = getBreedById.execute('nonexistent');
      
      expect(existingResult).toBeInstanceOf(Promise);
      expect(nonExistingResult).toBeInstanceOf(Promise);
      
      const resolvedExisting = await existingResult;
      const resolvedNonExisting = await nonExistingResult;
      
      expect(resolvedExisting).not.toBeNull();
      expect(typeof resolvedExisting).toBe('object');
      expect(resolvedNonExisting).toBeNull();
    });

    it('should maintain breed data integrity when found', async () => {
      const result = await getBreedById.execute('abys');
      
      expect(result?.id).toBe('abys');
      expect(result?.name).toBe('Abyssinian');
      expect(result?.origin).toBe('Egypt');
      expect(result?.weight.imperial).toBe('7  -  10');
      expect(result?.weight.metric).toBe('3 - 5');
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in breed ID', async () => {
      const specialBreed: Breed = {
        id: 'breed-with-dashes_and_underscores',
        name: 'Special Breed',
        description: 'A breed with special ID',
        temperament: 'Calm',
        origin: 'Test',
        life_span: '10 - 15',
        weight: {
          imperial: '5 - 8',
          metric: '2 - 4'
        }
      };
      mockCatRepository.setBreeds([specialBreed]);
      
      const result = await getBreedById.execute('breed-with-dashes_and_underscores');
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('breed-with-dashes_and_underscores');
    });

    it('should handle numeric-like string IDs', async () => {
      const numericBreed: Breed = {
        id: '123',
        name: 'Numeric Breed',
        description: 'A breed with numeric ID',
        temperament: 'Playful',
        origin: 'Test',
        life_span: '12 - 18',
        weight: {
          imperial: '6 - 9',
          metric: '3 - 4'
        }
      };
      mockCatRepository.setBreeds([numericBreed]);
      
      const result = await getBreedById.execute('123');
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('123');
    });

    it('should handle whitespace in breed ID parameter', async () => {
      const result = await getBreedById.execute(' abys ');
      
      // Should not find breed due to exact match requirement
      expect(result).toBeNull();
    });
  });

  describe('Use case behavior', () => {
    it('should be a simple pass-through to repository', async () => {
      const repositoryResult = await mockCatRepository.getBreedById('abys');
      const useCaseResult = await getBreedById.execute('abys');
      
      expect(useCaseResult).toEqual(repositoryResult);
    });

    it('should not modify repository data', async () => {
      const result = await getBreedById.execute('abys');
      
      // Should return exactly what repository returns
      expect(result).toEqual(sampleBreeds[0]);
    });

    it('should handle multiple consecutive calls correctly', async () => {
      const result1 = await getBreedById.execute('abys');
      const result2 = await getBreedById.execute('abys');
      const result3 = await getBreedById.execute('aege');
      
      expect(result1).toEqual(result2);
      expect(result1).not.toEqual(result3);
      expect(result3?.id).toBe('aege');
    });
  });
});