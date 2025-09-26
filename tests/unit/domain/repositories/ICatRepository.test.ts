import { ICatRepository } from '../../../../src/domain/repositories/ICatRepository';
import { Cat } from '../../../../src/domain/entities/Cat';
import { Breed } from '../../../../src/domain/entities/Breed';

// Mock implementation for testing interface contract
class MockCatRepository implements ICatRepository {
  private breeds: Breed[] = [];
  private cats: Cat[] = [];



  async getBreeds(): Promise<Breed[]> {
    return Promise.resolve([...this.breeds]);
  }

  async getBreedById(breedId: string): Promise<Breed | null> {
    const breed = this.breeds.find(b => b.id === breedId);
    return Promise.resolve(breed || null);
  }

  async searchBreeds(query: string): Promise<Breed[]> {
    const filteredBreeds = this.breeds.filter(breed => 
      breed.name.toLowerCase().includes(query.toLowerCase()) ||
      breed.description.toLowerCase().includes(query.toLowerCase())
    );
    return Promise.resolve(filteredBreeds);
  }

  async getImagesByBreedId(breedId: string, limit?: number): Promise<Cat[]> {
    let filteredCats = this.cats.filter(cat => 
      cat.breeds?.some(breed => breed.id === breedId)
    );
    
    if (limit) {
      filteredCats = filteredCats.slice(0, limit);
    }
    
    return Promise.resolve(filteredCats);
  }

  // Helper methods for testing
  setBreeds(breeds: Breed[]): void {
    this.breeds = [...breeds];
  }

  setCats(cats: Cat[]): void {
    this.cats = [...cats];
  }
}

describe('ICatRepository Interface Contract', () => {
  let repository: MockCatRepository;
  let sampleCat: Cat;
  let sampleBreed: Breed;

  beforeEach(() => {
    repository = new MockCatRepository();
    
    sampleBreed = {
      id: 'breed1',
      name: 'Persian',
      description: 'Long-haired breed',
      temperament: 'Calm, Gentle',
      origin: 'Iran',
      life_span: '12 - 17',
      weight: {
        imperial: '7 - 12',
        metric: '3 - 5'
      }
    };

    sampleCat = {
      id: 'cat1',
      url: 'https://example.com/cat1.jpg',
      width: 800,
      height: 600,
      breeds: [sampleBreed]
    };
  });

  describe('getBreeds method', () => {
    it('should return empty array when no breeds exist', async () => {
      const result = await repository.getBreeds();
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return all breeds when they exist', async () => {
      repository.setBreeds([sampleBreed]);
      const result = await repository.getBreeds();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(sampleBreed);
    });

    it('should return Promise<Breed[]>', async () => {
      const result = repository.getBreeds();
      expect(result).toBeInstanceOf(Promise);
      const breeds = await result;
      expect(Array.isArray(breeds)).toBe(true);
    });
  });

  describe('getBreedById method', () => {
    it('should return breed when found by id', async () => {
      repository.setBreeds([sampleBreed]);
      const result = await repository.getBreedById('breed1');
      expect(result).toEqual(sampleBreed);
    });

    it('should return null when breed not found', async () => {
      const result = await repository.getBreedById('nonexistent');
      expect(result).toBeNull();
    });

    it('should accept string parameter and return Promise<Breed | null>', async () => {
      const result = repository.getBreedById('breed1');
      expect(result).toBeInstanceOf(Promise);
      const breed = await result;
      expect(breed === null || typeof breed === 'object').toBe(true);
    });
  });

  describe('searchBreeds method', () => {
    it('should return breeds matching name query', async () => {
      repository.setBreeds([sampleBreed]);
      const result = await repository.searchBreeds('Persian');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(sampleBreed);
    });

    it('should return breeds matching description query', async () => {
      repository.setBreeds([sampleBreed]);
      const result = await repository.searchBreeds('Long-haired');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(sampleBreed);
    });

    it('should be case insensitive', async () => {
      repository.setBreeds([sampleBreed]);
      const result = await repository.searchBreeds('persian');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(sampleBreed);
    });

    it('should return empty array when no breeds match', async () => {
      repository.setBreeds([sampleBreed]);
      const result = await repository.searchBreeds('nonexistent');
      expect(result).toEqual([]);
    });

    it('should accept string parameter and return Promise<Breed[]>', async () => {
      const result = repository.searchBreeds('test');
      expect(result).toBeInstanceOf(Promise);
      const breeds = await result;
      expect(Array.isArray(breeds)).toBe(true);
    });
  });

  describe('getImagesByBreedId method', () => {
    it('should return cats with matching breed', async () => {
      repository.setCats([sampleCat]);
      const result = await repository.getImagesByBreedId('breed1');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(sampleCat);
    });

    it('should return empty array when no cats match breed', async () => {
      repository.setCats([sampleCat]);
      const result = await repository.getImagesByBreedId('nonexistent');
      expect(result).toEqual([]);
    });

    it('should limit results when limit parameter is provided', async () => {
      const cats = [sampleCat, { ...sampleCat, id: 'cat2' }, { ...sampleCat, id: 'cat3' }];
      repository.setCats(cats);
      const result = await repository.getImagesByBreedId('breed1', 2);
      expect(result).toHaveLength(2);
    });

    it('should return all results when no limit is provided', async () => {
      const cats = [sampleCat, { ...sampleCat, id: 'cat2' }, { ...sampleCat, id: 'cat3' }];
      repository.setCats(cats);
      const result = await repository.getImagesByBreedId('breed1');
      expect(result).toHaveLength(3);
    });

    it('should accept string and optional number parameters and return Promise<Cat[]>', async () => {
      const result = repository.getImagesByBreedId('breed1', 5);
      expect(result).toBeInstanceOf(Promise);
      const cats = await result;
      expect(Array.isArray(cats)).toBe(true);
    });
  });

  describe('Interface compliance', () => {
    it('should implement all required methods', () => {
      expect(typeof repository.getBreeds).toBe('function');
      expect(typeof repository.getBreedById).toBe('function');
      expect(typeof repository.searchBreeds).toBe('function');
      expect(typeof repository.getImagesByBreedId).toBe('function');
    });

    it('should have correct method signatures', () => {
      // Check that methods return promises
      expect(repository.getBreeds()).toBeInstanceOf(Promise);
      expect(repository.getBreedById('test')).toBeInstanceOf(Promise);
      expect(repository.searchBreeds('test')).toBeInstanceOf(Promise);
      expect(repository.getImagesByBreedId('test')).toBeInstanceOf(Promise);
      expect(repository.getImagesByBreedId('test', 5)).toBeInstanceOf(Promise);
    });
  });
});