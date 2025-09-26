import { SearchBreeds } from '../../../../../src/application/use-cases/cats/SearchBreeds';
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
      breed.description?.toLowerCase().includes(query.toLowerCase()) ||
      breed.temperament?.toLowerCase().includes(query.toLowerCase())
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

describe('SearchBreeds Use Case', () => {
  let searchBreeds: SearchBreeds;
  let mockCatRepository: MockCatRepository;
  let sampleBreeds: Breed[];

  beforeEach(() => {
    mockCatRepository = new MockCatRepository();
    searchBreeds = new SearchBreeds(mockCatRepository);
    
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
      },
      {
        id: 'pers',
        name: 'Persian',
        description: 'The Persian cat is a long-haired breed of cat characterized by its round face.',
        temperament: 'Affectionate, Loyal, Sedate, Quiet',
        origin: 'Iran',
        life_span: '10 - 17',
        weight: {
          imperial: '7 - 12',
          metric: '3 - 5'
        },
        wikipedia_url: 'https://en.wikipedia.org/wiki/Persian_cat',
        reference_image_id: '0XYvRd7oD'
      }
    ];

    mockCatRepository.setBreeds(sampleBreeds);
  });

  describe('Successful search', () => {
    it('should return breeds matching query in name', async () => {
      const result = await searchBreeds.execute('Persian');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Persian');
      expect(result[0].id).toBe('pers');
    });

    it('should return breeds matching query in description', async () => {
      const result = await searchBreeds.execute('fun to live');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bengal');
      expect(result[0].id).toBe('beng');
    });

    it('should return multiple breeds when query matches multiple', async () => {
      const result = await searchBreeds.execute('Active');
      
      expect(result.length).toBeGreaterThan(1);
      expect(result.some(breed => breed.name === 'Abyssinian')).toBe(true);
      expect(result.some(breed => breed.name === 'Aegean')).toBe(true);
    });

    it('should be case insensitive', async () => {
      const lowerResult = await searchBreeds.execute('persian');
      const upperResult = await searchBreeds.execute('PERSIAN');
      const mixedResult = await searchBreeds.execute('PeRsIaN');
      
      expect(lowerResult).toHaveLength(1);
      expect(upperResult).toHaveLength(1);
      expect(mixedResult).toHaveLength(1);
      expect(lowerResult[0].name).toBe('Persian');
      expect(upperResult[0].name).toBe('Persian');
      expect(mixedResult[0].name).toBe('Persian');
    });

    it('should return empty array when no matches found', async () => {
      const result = await searchBreeds.execute('nonexistent breed');
      
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should handle partial matches', async () => {
      const result = await searchBreeds.execute('Aby');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Abyssinian');
    });
  });

  describe('Query validation', () => {
    it('should throw error when query is empty string', async () => {
      await expect(searchBreeds.execute(''))
        .rejects
        .toThrow('Query de búsqueda requerido');
    });

    it('should throw error when query is only whitespace', async () => {
      await expect(searchBreeds.execute('   '))
        .rejects
        .toThrow('Query de búsqueda requerido');
      
      await expect(searchBreeds.execute('\t\n  '))
        .rejects
        .toThrow('Query de búsqueda requerido');
    });

    it('should throw error when query is null or undefined', async () => {
      await expect(searchBreeds.execute(null as any))
        .rejects
        .toThrow('Query de búsqueda requerido');
      
      await expect(searchBreeds.execute(undefined as any))
        .rejects
        .toThrow('Query de búsqueda requerido');
    });

    it('should trim whitespace from valid queries', async () => {
      const searchBreedsSpy = jest.spyOn(mockCatRepository, 'searchBreeds');
      
      await searchBreeds.execute('  Persian  ');
      
      expect(searchBreedsSpy).toHaveBeenCalledWith('Persian');
    });
  });

  describe('Repository integration', () => {
    it('should call catRepository.searchBreeds with trimmed query', async () => {
      const searchBreedsSpy = jest.spyOn(mockCatRepository, 'searchBreeds');
      
      await searchBreeds.execute('Persian');
      
      expect(searchBreedsSpy).toHaveBeenCalledWith('Persian');
      expect(searchBreedsSpy).toHaveBeenCalledTimes(1);
    });

    it('should pass through different queries correctly', async () => {
      const searchBreedsSpy = jest.spyOn(mockCatRepository, 'searchBreeds');
      
      await searchBreeds.execute('Persian');
      await searchBreeds.execute('Bengal');
      await searchBreeds.execute('cat');
      
      expect(searchBreedsSpy).toHaveBeenNthCalledWith(1, 'Persian');
      expect(searchBreedsSpy).toHaveBeenNthCalledWith(2, 'Bengal');
      expect(searchBreedsSpy).toHaveBeenNthCalledWith(3, 'cat');
      expect(searchBreedsSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Return value', () => {
    it('should return Promise<Breed[]>', async () => {
      const result = searchBreeds.execute('Persian');
      
      expect(result).toBeInstanceOf(Promise);
      
      const resolvedResult = await result;
      expect(Array.isArray(resolvedResult)).toBe(true);
      expect(resolvedResult.every(item => typeof item === 'object')).toBe(true);
    });

    it('should return breeds with complete data structure', async () => {
      const result = await searchBreeds.execute('Persian');
      
      expect(result).toHaveLength(1);
      const breed = result[0];
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

    it('should maintain breed data integrity', async () => {
      const result = await searchBreeds.execute('Persian');
      
      expect(result[0].id).toBe('pers');
      expect(result[0].name).toBe('Persian');
      expect(result[0].origin).toBe('Iran');
      expect(result[0].weight.imperial).toBe('7 - 12');
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in query', async () => {
      const result = await searchBreeds.execute('they\'re definitely');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bengal');
    });

    it('should handle numeric queries', async () => {
      const result = await searchBreeds.execute('123');
      
      expect(result).toHaveLength(0);
    });

    it('should handle very long queries', async () => {
      const longQuery = 'a'.repeat(1000);
      const result = await searchBreeds.execute(longQuery);
      
      expect(result).toHaveLength(0);
    });

    it('should handle queries with multiple words', async () => {
      const result = await searchBreeds.execute('Greek islands');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Aegean');
    });

    it('should handle repository returning empty results', async () => {
      mockCatRepository.setBreeds([]);
      
      const result = await searchBreeds.execute('Persian');
      
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe('Search functionality', () => {
    it('should search in both name and description fields', async () => {
      // Search by name
      const nameResult = await searchBreeds.execute('Abyssinian');
      expect(nameResult).toHaveLength(1);
      expect(nameResult[0].name).toBe('Abyssinian');
      
      // Search by description
      const descResult = await searchBreeds.execute('easy to care');
      expect(descResult).toHaveLength(1);
      expect(descResult[0].name).toBe('Abyssinian');
    });

    it('should return unique results when query matches both name and description', async () => {
      // Create a breed where query matches both name and description
      const testBreed: Breed = {
        id: 'test',
        name: 'Test Cat',
        description: 'This is a test cat breed for testing',
        temperament: 'Calm',
        origin: 'Test',
        life_span: '10 - 15',
        weight: {
          imperial: '5 - 8',
          metric: '2 - 4'
        }
      };
      mockCatRepository.setBreeds([testBreed]);
      
      const result = await searchBreeds.execute('test');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Cat');
    });

    it('should handle queries that match multiple fields across different breeds', async () => {
      const result = await searchBreeds.execute('Active');
      
      // Should match breeds that have 'Active' in temperament
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(breed => breed.name === 'Abyssinian')).toBe(true);
      expect(result.some(breed => breed.name === 'Aegean')).toBe(true);
    });
  });

  describe('Use case behavior', () => {
    it('should validate input before calling repository', async () => {
      const searchBreedsSpy = jest.spyOn(mockCatRepository, 'searchBreeds');
      
      try {
        await searchBreeds.execute('');
      } catch (error) {
        // Expected error
      }
      
      expect(searchBreedsSpy).not.toHaveBeenCalled();
    });

    it('should trim query before passing to repository', async () => {
      const searchBreedsSpy = jest.spyOn(mockCatRepository, 'searchBreeds');
      
      await searchBreeds.execute('  Persian  ');
      
      expect(searchBreedsSpy).toHaveBeenCalledWith('Persian');
    });

    it('should pass through repository results without modification', async () => {
      const repositoryResult = await mockCatRepository.searchBreeds('Persian');
      const useCaseResult = await searchBreeds.execute('Persian');
      
      expect(useCaseResult).toEqual(repositoryResult);
    });
  });
});