import { GetBreeds } from '../../../../../src/application/use-cases/cats/GetBreeds';
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

describe('GetBreeds Use Case', () => {
  let getBreeds: GetBreeds;
  let mockCatRepository: MockCatRepository;
  let sampleBreeds: Breed[];

  beforeEach(() => {
    mockCatRepository = new MockCatRepository();
    getBreeds = new GetBreeds(mockCatRepository);
    
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
      }
    ];
  });

  describe('Successful execution', () => {
    it('should return all breeds when repository has data', async () => {
      mockCatRepository.setBreeds(sampleBreeds);
      
      const result = await getBreeds.execute();
      
      expect(result).toHaveLength(2);
      expect(result).toEqual(sampleBreeds);
    });

    it('should return empty array when no breeds exist', async () => {
      mockCatRepository.setBreeds([]);
      
      const result = await getBreeds.execute();
      
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should return array of Breed objects with correct structure', async () => {
      mockCatRepository.setBreeds(sampleBreeds);
      
      const result = await getBreeds.execute();
      
      result.forEach(breed => {
        expect(breed).toHaveProperty('id');
        expect(breed).toHaveProperty('name');
        expect(breed).toHaveProperty('description');
        expect(breed).toHaveProperty('temperament');
        expect(breed).toHaveProperty('origin');
        expect(breed).toHaveProperty('life_span');
        expect(breed).toHaveProperty('weight');
        expect(breed.weight).toHaveProperty('imperial');
        expect(breed.weight).toHaveProperty('metric');
      });
    });

    it('should return a copy of breeds array (not reference)', async () => {
      mockCatRepository.setBreeds(sampleBreeds);
      
      const result1 = await getBreeds.execute();
      const result2 = await getBreeds.execute();
      
      expect(result1).toEqual(result2);
      expect(result1).not.toBe(result2); // Different references
      
      // Modifying result should not affect subsequent calls
      result1.pop();
      const result3 = await getBreeds.execute();
      expect(result3).toHaveLength(2);
    });
  });

  describe('Repository integration', () => {
    it('should call catRepository.getBreeds method', async () => {
      const getBreedsSpy = jest.spyOn(mockCatRepository, 'getBreeds');
      mockCatRepository.setBreeds(sampleBreeds);
      
      await getBreeds.execute();
      
      expect(getBreedsSpy).toHaveBeenCalledTimes(1);
      expect(getBreedsSpy).toHaveBeenCalledWith();
    });

    it('should handle repository returning different data types', async () => {
      const singleBreed = [sampleBreeds[0]];
      mockCatRepository.setBreeds(singleBreed);
      
      const result = await getBreeds.execute();
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(sampleBreeds[0]);
    });
  });

  describe('Return value', () => {
    it('should return Promise<Breed[]>', async () => {
      mockCatRepository.setBreeds(sampleBreeds);
      
      const result = getBreeds.execute();
      
      expect(result).toBeInstanceOf(Promise);
      
      const resolvedResult = await result;
      expect(Array.isArray(resolvedResult)).toBe(true);
      expect(resolvedResult.every(item => typeof item === 'object')).toBe(true);
    });

    it('should maintain breed data integrity', async () => {
      mockCatRepository.setBreeds(sampleBreeds);
      
      const result = await getBreeds.execute();
      
      expect(result[0].id).toBe('abys');
      expect(result[0].name).toBe('Abyssinian');
      expect(result[0].origin).toBe('Egypt');
      expect(result[1].id).toBe('aege');
      expect(result[1].name).toBe('Aegean');
      expect(result[1].origin).toBe('Greece');
    });
  });

  describe('Edge cases', () => {
    it('should handle large number of breeds', async () => {
      const manyBreeds = Array.from({ length: 100 }, (_, index) => ({
        ...sampleBreeds[0],
        id: `breed-${index}`,
        name: `Breed ${index}`
      }));
      mockCatRepository.setBreeds(manyBreeds);
      
      const result = await getBreeds.execute();
      
      expect(result).toHaveLength(100);
      expect(result[0].name).toBe('Breed 0');
      expect(result[99].name).toBe('Breed 99');
    });

    it('should handle breeds with minimal data', async () => {
      const minimalBreed: Breed = {
        id: 'minimal',
        name: 'Minimal Cat',
        description: 'A minimal cat breed',
        temperament: 'Calm',
        origin: 'Unknown',
        life_span: '10 - 15',
        weight: {
          imperial: '5 - 8',
          metric: '2 - 4'
        }
      };
      mockCatRepository.setBreeds([minimalBreed]);
      
      const result = await getBreeds.execute();
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(minimalBreed);
    });
  });

  describe('Use case behavior', () => {
    it('should be a simple pass-through to repository', async () => {
      mockCatRepository.setBreeds(sampleBreeds);
      
      const repositoryResult = await mockCatRepository.getBreeds();
      const useCaseResult = await getBreeds.execute();
      
      expect(useCaseResult).toEqual(repositoryResult);
    });

    it('should not modify or filter repository data', async () => {
      mockCatRepository.setBreeds(sampleBreeds);
      
      const result = await getBreeds.execute();
      
      // Should return exactly what repository returns
      expect(result).toEqual(sampleBreeds);
      expect(result).toHaveLength(sampleBreeds.length);
    });
  });
});