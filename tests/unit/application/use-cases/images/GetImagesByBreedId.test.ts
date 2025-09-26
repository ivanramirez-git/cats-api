import { GetImagesByBreedId } from '../../../../../src/application/use-cases/images/GetImagesByBreedId';
import { ICatRepository } from '../../../../../src/domain/repositories/ICatRepository';
import { Breed } from '../../../../../src/domain/entities/Breed';
import { Cat } from '../../../../../src/domain/entities/Cat';

// Mock CatRepository
class MockCatRepository implements ICatRepository {
  private breeds: Breed[] = [];
  private cats: Cat[] = [];

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

  async getImagesByBreedId(breedId: string, limit?: number): Promise<Cat[]> {
    const breedCats = this.cats.filter(cat => cat.breeds?.some(breed => breed.id === breedId));
    return limit ? breedCats.slice(0, limit) : breedCats;
  }

  // Helper methods for testing
  setBreeds(breeds: Breed[]): void {
    this.breeds = [...breeds];
  }

  setCats(cats: Cat[]): void {
    this.cats = [...cats];
  }
}

describe('GetImagesByBreedId Use Case', () => {
  let getImagesByBreedId: GetImagesByBreedId;
  let mockCatRepository: MockCatRepository;
  let sampleCats: Cat[];
  let sampleBreeds: Breed[];

  beforeEach(() => {
    mockCatRepository = new MockCatRepository();
    getImagesByBreedId = new GetImagesByBreedId(mockCatRepository);
    
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
        id: 'beng',
        name: 'Bengal',
        description: 'Bengals are a lot of fun to live with.',
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

    sampleCats = [
      {
        id: 'cat1',
        url: 'https://example.com/cat1.jpg',
        width: 800,
        height: 600,
        breeds: [sampleBreeds[0]] // Abyssinian
      },
      {
        id: 'cat2',
        url: 'https://example.com/cat2.jpg',
        width: 1024,
        height: 768,
        breeds: [sampleBreeds[0]] // Abyssinian
      },
      {
        id: 'cat3',
        url: 'https://example.com/cat3.jpg',
        width: 640,
        height: 480,
        breeds: [sampleBreeds[1]] // Bengal
      },
      {
        id: 'cat4',
        url: 'https://example.com/cat4.jpg',
        width: 1200,
        height: 900,
        breeds: [sampleBreeds[0]] // Abyssinian
      },
      {
        id: 'cat5',
        url: 'https://example.com/cat5.jpg',
        width: 800,
        height: 600,
        breeds: [sampleBreeds[1]] // Bengal
      }
    ];

    mockCatRepository.setBreeds(sampleBreeds);
    mockCatRepository.setCats(sampleCats);
  });

  describe('Successful execution', () => {
    it('should return images for valid breed ID with default limit', async () => {
      const result = await getImagesByBreedId.execute('abys');
      
      expect(result).toHaveLength(3);
      expect(result.every(cat => cat.breeds?.some(breed => breed.id === 'abys'))).toBe(true);
      expect(result[0].id).toBe('cat1');
      expect(result[1].id).toBe('cat2');
      expect(result[2].id).toBe('cat4');
    });

    it('should return images for valid breed ID with custom limit', async () => {
      const result = await getImagesByBreedId.execute('abys', 2);
      
      expect(result).toHaveLength(2);
      expect(result.every(cat => cat.breeds?.some(breed => breed.id === 'abys'))).toBe(true);
      expect(result[0].id).toBe('cat1');
      expect(result[1].id).toBe('cat2');
    });

    it('should return images for different breed', async () => {
      const result = await getImagesByBreedId.execute('beng');
      
      expect(result).toHaveLength(2);
      expect(result.every(cat => cat.breeds?.some(breed => breed.id === 'beng'))).toBe(true);
      expect(result[0].id).toBe('cat3');
      expect(result[1].id).toBe('cat5');
    });

    it('should return empty array for breed with no images', async () => {
      const result = await getImagesByBreedId.execute('nonexistent');
      
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should return correct data structure', async () => {
      const result = await getImagesByBreedId.execute('abys', 1);
      
      expect(result).toHaveLength(1);
      const cat = result[0];
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('url');
      expect(cat).toHaveProperty('width');
      expect(cat).toHaveProperty('height');
      expect(cat).toHaveProperty('breeds');
      expect(Array.isArray(cat.breeds)).toBe(true);
    });
  });

  describe('Breed ID validation', () => {
    it('should throw error when breedId is empty string', async () => {
      await expect(getImagesByBreedId.execute(''))
        .rejects
        .toThrow('ID de raza requerido');
    });

    it('should throw error when breedId is only whitespace', async () => {
      await expect(getImagesByBreedId.execute('   '))
        .rejects
        .toThrow('ID de raza requerido');
      
      await expect(getImagesByBreedId.execute('\t\n  '))
        .rejects
        .toThrow('ID de raza requerido');
    });

    it('should throw error when breedId is null or undefined', async () => {
      await expect(getImagesByBreedId.execute(null as any))
        .rejects
        .toThrow('ID de raza requerido');
      
      await expect(getImagesByBreedId.execute(undefined as any))
        .rejects
        .toThrow('ID de raza requerido');
    });

    it('should trim whitespace from valid breedId', async () => {
      const getImagesSpy = jest.spyOn(mockCatRepository, 'getImagesByBreedId');
      
      await getImagesByBreedId.execute('  abys  ');
      
      expect(getImagesSpy).toHaveBeenCalledWith('abys', 10);
    });
  });

  describe('Limit validation', () => {
    it('should throw error when limit is 0', async () => {
      await expect(getImagesByBreedId.execute('abys', 0))
        .rejects
        .toThrow('Límite debe estar entre 1 y 100');
    });

    it('should throw error when limit is negative', async () => {
      await expect(getImagesByBreedId.execute('abys', -1))
        .rejects
        .toThrow('Límite debe estar entre 1 y 100');
      
      await expect(getImagesByBreedId.execute('abys', -10))
        .rejects
        .toThrow('Límite debe estar entre 1 y 100');
    });

    it('should throw error when limit is greater than 100', async () => {
      await expect(getImagesByBreedId.execute('abys', 101))
        .rejects
        .toThrow('Límite debe estar entre 1 y 100');
      
      await expect(getImagesByBreedId.execute('abys', 1000))
        .rejects
        .toThrow('Límite debe estar entre 1 y 100');
    });

    it('should accept valid limits', async () => {
      await expect(getImagesByBreedId.execute('abys', 1)).resolves.not.toThrow();
      await expect(getImagesByBreedId.execute('abys', 50)).resolves.not.toThrow();
      await expect(getImagesByBreedId.execute('abys', 100)).resolves.not.toThrow();
    });

    it('should use default limit of 10 when not provided', async () => {
      const getImagesSpy = jest.spyOn(mockCatRepository, 'getImagesByBreedId');
      
      await getImagesByBreedId.execute('abys');
      
      expect(getImagesSpy).toHaveBeenCalledWith('abys', 10);
    });
  });

  describe('Repository integration', () => {
    it('should call catRepository.getImagesByBreedId with correct parameters', async () => {
      const getImagesSpy = jest.spyOn(mockCatRepository, 'getImagesByBreedId');
      
      await getImagesByBreedId.execute('abys', 5);
      
      expect(getImagesSpy).toHaveBeenCalledWith('abys', 5);
      expect(getImagesSpy).toHaveBeenCalledTimes(1);
    });

    it('should pass through different parameters correctly', async () => {
      const getImagesSpy = jest.spyOn(mockCatRepository, 'getImagesByBreedId');
      
      await getImagesByBreedId.execute('abys', 3);
      await getImagesByBreedId.execute('beng', 7);
      await getImagesByBreedId.execute('pers', 1);
      
      expect(getImagesSpy).toHaveBeenNthCalledWith(1, 'abys', 3);
      expect(getImagesSpy).toHaveBeenNthCalledWith(2, 'beng', 7);
      expect(getImagesSpy).toHaveBeenNthCalledWith(3, 'pers', 1);
      expect(getImagesSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Return value', () => {
    it('should return Promise<Cat[]>', async () => {
      const result = getImagesByBreedId.execute('abys');
      
      expect(result).toBeInstanceOf(Promise);
      
      const resolvedResult = await result;
      expect(Array.isArray(resolvedResult)).toBe(true);
      expect(resolvedResult.every(item => typeof item === 'object')).toBe(true);
    });

    it('should return cats with complete data structure', async () => {
      const result = await getImagesByBreedId.execute('abys', 1);
      
      expect(result).toHaveLength(1);
      const cat = result[0];
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('url');
      expect(cat).toHaveProperty('width');
      expect(cat).toHaveProperty('height');
      expect(cat).toHaveProperty('breeds');
      expect(typeof cat.width).toBe('number');
      expect(typeof cat.height).toBe('number');
      expect(typeof cat.url).toBe('string');
    });

    it('should maintain cat data integrity', async () => {
      const result = await getImagesByBreedId.execute('abys', 1);
      
      expect(result[0].id).toBe('cat1');
      expect(result[0].url).toBe('https://example.com/cat1.jpg');
      expect(result[0].width).toBe(800);
      expect(result[0].height).toBe(600);
      expect(result[0].breeds?.[0].id).toBe('abys');
    });
  });

  describe('Edge cases', () => {
    it('should handle breed ID with special characters', async () => {
      const specialCat: Cat = {
        id: 'special-cat',
        url: 'https://example.com/special.jpg',
        width: 800,
        height: 600,
        breeds: [{
          id: 'breed-123',
          name: 'Special Breed',
          description: 'A special breed',
          temperament: 'Calm',
          origin: 'Test',
          life_span: '10 - 15',
          weight: {
            imperial: '5 - 8',
            metric: '2 - 4'
          }
        }]
      };
      mockCatRepository.setCats([specialCat]);
      
      const result = await getImagesByBreedId.execute('breed-123');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('special-cat');
    });

    it('should handle limit equal to available images', async () => {
      const result = await getImagesByBreedId.execute('abys', 3);
      
      expect(result).toHaveLength(3);
    });

    it('should handle limit greater than available images', async () => {
      const result = await getImagesByBreedId.execute('abys', 10);
      
      expect(result).toHaveLength(3); // Only 3 Abyssinian cats available
    });

    it('should handle repository returning empty results', async () => {
      mockCatRepository.setCats([]);
      
      const result = await getImagesByBreedId.execute('abys');
      
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should handle cats with multiple breeds', async () => {
      const multiBreedCat: Cat = {
        id: 'multi-cat',
        url: 'https://example.com/multi.jpg',
        width: 800,
        height: 600,
        breeds: [sampleBreeds[0], sampleBreeds[1]] // Both Abyssinian and Bengal
      };
      mockCatRepository.setCats([multiBreedCat]);
      
      const abysResult = await getImagesByBreedId.execute('abys');
      const bengResult = await getImagesByBreedId.execute('beng');
      
      expect(abysResult).toHaveLength(1);
      expect(bengResult).toHaveLength(1);
      expect(abysResult[0].id).toBe('multi-cat');
      expect(bengResult[0].id).toBe('multi-cat');
    });

    it('should handle cats with no breeds', async () => {
      const noBreedCat: Cat = {
        id: 'no-breed-cat',
        url: 'https://example.com/nobreed.jpg',
        width: 800,
        height: 600,
        breeds: []
      };
      mockCatRepository.setCats([noBreedCat]);
      
      const result = await getImagesByBreedId.execute('abys');
      
      expect(result).toHaveLength(0);
    });
  });

  describe('Use case behavior', () => {
    it('should validate breedId before calling repository', async () => {
      const getImagesSpy = jest.spyOn(mockCatRepository, 'getImagesByBreedId');
      
      try {
        await getImagesByBreedId.execute('');
      } catch (error) {
        // Expected error
      }
      
      expect(getImagesSpy).not.toHaveBeenCalled();
    });

    it('should validate limit before calling repository', async () => {
      const getImagesSpy = jest.spyOn(mockCatRepository, 'getImagesByBreedId');
      
      try {
        await getImagesByBreedId.execute('abys', 0);
      } catch (error) {
        // Expected error
      }
      
      expect(getImagesSpy).not.toHaveBeenCalled();
    });

    it('should trim breedId before passing to repository', async () => {
      const getImagesSpy = jest.spyOn(mockCatRepository, 'getImagesByBreedId');
      
      await getImagesByBreedId.execute('  abys  ', 5);
      
      expect(getImagesSpy).toHaveBeenCalledWith('abys', 5);
    });

    it('should pass through repository results without modification', async () => {
      const repositoryResult = await mockCatRepository.getImagesByBreedId('abys', 2);
      const useCaseResult = await getImagesByBreedId.execute('abys', 2);
      
      expect(useCaseResult).toEqual(repositoryResult);
    });
  });
});