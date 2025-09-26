import { Cat, Breed } from '../../../../src/domain/entities/Cat';
import { Breed as BreedEntity } from '../../../../src/domain/entities/Breed';

describe('Cat Entity', () => {
  describe('Cat Interface', () => {
    it('should have all required properties', () => {
      const cat: Cat = {
        id: 'cat123',
        url: 'https://example.com/cat.jpg',
        width: 800,
        height: 600
      };

      expect(cat.id).toBe('cat123');
      expect(cat.url).toBe('https://example.com/cat.jpg');
      expect(cat.width).toBe(800);
      expect(cat.height).toBe(600);
      expect(cat.breeds).toBeUndefined();
    });

    it('should allow optional breeds property', () => {
      const breed: Breed = {
        id: 'abys',
        name: 'Abyssinian',
        description: 'Active and playful cat',
        temperament: 'Active, Energetic, Independent',
        origin: 'Egypt',
        life_span: '14 - 15',
        weight: {
          imperial: '7 - 10',
          metric: '3 - 5'
        }
      };

      const cat: Cat = {
        id: 'cat123',
        url: 'https://example.com/cat.jpg',
        width: 800,
        height: 600,
        breeds: [breed]
      };

      expect(cat.breeds).toBeDefined();
      expect(cat.breeds).toHaveLength(1);
      expect(cat.breeds![0]).toEqual(breed);
    });

    it('should allow empty breeds array', () => {
      const cat: Cat = {
        id: 'cat123',
        url: 'https://example.com/cat.jpg',
        width: 800,
        height: 600,
        breeds: []
      };

      expect(cat.breeds).toBeDefined();
      expect(cat.breeds).toHaveLength(0);
    });

    it('should allow multiple breeds', () => {
      const breed1: Breed = {
        id: 'abys',
        name: 'Abyssinian',
        description: 'Active and playful cat',
        temperament: 'Active, Energetic, Independent',
        origin: 'Egypt',
        life_span: '14 - 15',
        weight: {
          imperial: '7 - 10',
          metric: '3 - 5'
        }
      };

      const breed2: Breed = {
        id: 'beng',
        name: 'Bengal',
        description: 'Energetic and athletic cat',
        temperament: 'Alert, Agile, Energetic',
        origin: 'United States',
        life_span: '14 - 16',
        weight: {
          imperial: '8 - 15',
          metric: '4 - 7'
        }
      };

      const cat: Cat = {
        id: 'cat123',
        url: 'https://example.com/cat.jpg',
        width: 800,
        height: 600,
        breeds: [breed1, breed2]
      };

      expect(cat.breeds).toHaveLength(2);
      expect(cat.breeds![0]).toEqual(breed1);
      expect(cat.breeds![1]).toEqual(breed2);
    });

    it('should validate required string properties', () => {
      const cat: Cat = {
        id: '',
        url: '',
        width: 0,
        height: 0
      };

      expect(typeof cat.id).toBe('string');
      expect(typeof cat.url).toBe('string');
      expect(typeof cat.width).toBe('number');
      expect(typeof cat.height).toBe('number');
    });

    it('should validate numeric properties', () => {
      const cat: Cat = {
        id: 'cat123',
        url: 'https://example.com/cat.jpg',
        width: 1920,
        height: 1080
      };

      expect(cat.width).toBeGreaterThan(0);
      expect(cat.height).toBeGreaterThan(0);
      expect(Number.isInteger(cat.width)).toBe(true);
      expect(Number.isInteger(cat.height)).toBe(true);
    });
  });

  describe('Breed Interface (from Cat.ts)', () => {
    it('should have all required properties', () => {
      const breed: Breed = {
        id: 'abys',
        name: 'Abyssinian',
        description: 'The Abyssinian is easy to care for, and a joy to have in your home.',
        temperament: 'Active, Energetic, Independent, Intelligent, Gentle',
        origin: 'Egypt',
        life_span: '14 - 15',
        weight: {
          imperial: '7 - 10',
          metric: '3 - 5'
        }
      };

      expect(breed.id).toBe('abys');
      expect(breed.name).toBe('Abyssinian');
      expect(breed.description).toBeDefined();
      expect(breed.temperament).toBeDefined();
      expect(breed.origin).toBe('Egypt');
      expect(breed.life_span).toBe('14 - 15');
      expect(breed.weight).toBeDefined();
      expect(breed.weight.imperial).toBe('7 - 10');
      expect(breed.weight.metric).toBe('3 - 5');
    });

    it('should validate weight object structure', () => {
      const breed: Breed = {
        id: 'beng',
        name: 'Bengal',
        description: 'Bengal cats are athletic and energetic.',
        temperament: 'Alert, Agile, Energetic, Demanding, Intelligent',
        origin: 'United States',
        life_span: '14 - 16',
        weight: {
          imperial: '8 - 15',
          metric: '4 - 7'
        }
      };

      expect(breed.weight).toHaveProperty('imperial');
      expect(breed.weight).toHaveProperty('metric');
      expect(typeof breed.weight.imperial).toBe('string');
      expect(typeof breed.weight.metric).toBe('string');
    });

    it('should validate all string properties are strings', () => {
      const breed: Breed = {
        id: 'test',
        name: 'Test Breed',
        description: 'Test description',
        temperament: 'Test temperament',
        origin: 'Test origin',
        life_span: '10 - 15',
        weight: {
          imperial: '5 - 10',
          metric: '2 - 5'
        }
      };

      expect(typeof breed.id).toBe('string');
      expect(typeof breed.name).toBe('string');
      expect(typeof breed.description).toBe('string');
      expect(typeof breed.temperament).toBe('string');
      expect(typeof breed.origin).toBe('string');
      expect(typeof breed.life_span).toBe('string');
    });
  });
});

describe('Breed Entity (from Breed.ts)', () => {
  describe('BreedEntity Interface', () => {
    it('should have all required properties', () => {
      const breed: BreedEntity = {
        id: 'abys',
        name: 'Abyssinian',
        description: 'The Abyssinian is easy to care for, and a joy to have in your home.',
        temperament: 'Active, Energetic, Independent, Intelligent, Gentle',
        origin: 'Egypt',
        life_span: '14 - 15',
        weight: {
          imperial: '7 - 10',
          metric: '3 - 5'
        }
      };

      expect(breed.id).toBe('abys');
      expect(breed.name).toBe('Abyssinian');
      expect(breed.description).toBeDefined();
      expect(breed.temperament).toBeDefined();
      expect(breed.origin).toBe('Egypt');
      expect(breed.life_span).toBe('14 - 15');
      expect(breed.weight).toBeDefined();
      expect(breed.weight.imperial).toBe('7 - 10');
      expect(breed.weight.metric).toBe('3 - 5');
    });

    it('should allow optional wikipedia_url property', () => {
      const breed: BreedEntity = {
        id: 'abys',
        name: 'Abyssinian',
        description: 'Active and playful cat',
        temperament: 'Active, Energetic, Independent',
        origin: 'Egypt',
        life_span: '14 - 15',
        weight: {
          imperial: '7 - 10',
          metric: '3 - 5'
        },
        wikipedia_url: 'https://en.wikipedia.org/wiki/Abyssinian_cat'
      };

      expect(breed.wikipedia_url).toBe('https://en.wikipedia.org/wiki/Abyssinian_cat');
      expect(typeof breed.wikipedia_url).toBe('string');
    });

    it('should allow optional reference_image_id property', () => {
      const breed: BreedEntity = {
        id: 'abys',
        name: 'Abyssinian',
        description: 'Active and playful cat',
        temperament: 'Active, Energetic, Independent',
        origin: 'Egypt',
        life_span: '14 - 15',
        weight: {
          imperial: '7 - 10',
          metric: '3 - 5'
        },
        reference_image_id: 'img123'
      };

      expect(breed.reference_image_id).toBe('img123');
      expect(typeof breed.reference_image_id).toBe('string');
    });

    it('should allow both optional properties', () => {
      const breed: BreedEntity = {
        id: 'abys',
        name: 'Abyssinian',
        description: 'Active and playful cat',
        temperament: 'Active, Energetic, Independent',
        origin: 'Egypt',
        life_span: '14 - 15',
        weight: {
          imperial: '7 - 10',
          metric: '3 - 5'
        },
        wikipedia_url: 'https://en.wikipedia.org/wiki/Abyssinian_cat',
        reference_image_id: 'img123'
      };

      expect(breed.wikipedia_url).toBeDefined();
      expect(breed.reference_image_id).toBeDefined();
    });

    it('should work without optional properties', () => {
      const breed: BreedEntity = {
        id: 'abys',
        name: 'Abyssinian',
        description: 'Active and playful cat',
        temperament: 'Active, Energetic, Independent',
        origin: 'Egypt',
        life_span: '14 - 15',
        weight: {
          imperial: '7 - 10',
          metric: '3 - 5'
        }
      };

      expect(breed.wikipedia_url).toBeUndefined();
      expect(breed.reference_image_id).toBeUndefined();
    });

    it('should validate weight object structure', () => {
      const breed: BreedEntity = {
        id: 'beng',
        name: 'Bengal',
        description: 'Bengal cats are athletic and energetic.',
        temperament: 'Alert, Agile, Energetic, Demanding, Intelligent',
        origin: 'United States',
        life_span: '14 - 16',
        weight: {
          imperial: '8 - 15',
          metric: '4 - 7'
        }
      };

      expect(breed.weight).toHaveProperty('imperial');
      expect(breed.weight).toHaveProperty('metric');
      expect(typeof breed.weight.imperial).toBe('string');
      expect(typeof breed.weight.metric).toBe('string');
    });
  });

  describe('Relationship between Cat and Breed', () => {
    it('should allow Cat to contain Breed entities', () => {
      const breedEntity: BreedEntity = {
        id: 'abys',
        name: 'Abyssinian',
        description: 'Active and playful cat',
        temperament: 'Active, Energetic, Independent',
        origin: 'Egypt',
        life_span: '14 - 15',
        weight: {
          imperial: '7 - 10',
          metric: '3 - 5'
        },
        wikipedia_url: 'https://en.wikipedia.org/wiki/Abyssinian_cat',
        reference_image_id: 'img123'
      };

      // Convert BreedEntity to Breed (Cat.ts version)
      const breed: Breed = {
        id: breedEntity.id,
        name: breedEntity.name,
        description: breedEntity.description,
        temperament: breedEntity.temperament,
        origin: breedEntity.origin,
        life_span: breedEntity.life_span,
        weight: breedEntity.weight
      };

      const cat: Cat = {
        id: 'cat123',
        url: 'https://example.com/cat.jpg',
        width: 800,
        height: 600,
        breeds: [breed]
      };

      expect(cat.breeds![0].id).toBe(breedEntity.id);
      expect(cat.breeds![0].name).toBe(breedEntity.name);
      expect(cat.breeds![0].weight).toEqual(breedEntity.weight);
    });

    it('should handle breed compatibility between interfaces', () => {
      const fullBreed: BreedEntity = {
        id: 'beng',
        name: 'Bengal',
        description: 'Bengal cats are athletic and energetic.',
        temperament: 'Alert, Agile, Energetic, Demanding, Intelligent',
        origin: 'United States',
        life_span: '14 - 16',
        weight: {
          imperial: '8 - 15',
          metric: '4 - 7'
        },
        wikipedia_url: 'https://en.wikipedia.org/wiki/Bengal_cat',
        reference_image_id: 'bengal123'
      };

      // BreedEntity has all properties that Breed requires
      const catBreed: Breed = fullBreed;

      const cat: Cat = {
        id: 'cat456',
        url: 'https://example.com/bengal.jpg',
        width: 1024,
        height: 768,
        breeds: [catBreed]
      };

      expect(cat.breeds![0]).toEqual(expect.objectContaining({
        id: 'beng',
        name: 'Bengal',
        description: expect.any(String),
        temperament: expect.any(String),
        origin: 'United States',
        life_span: '14 - 16',
        weight: {
          imperial: '8 - 15',
          metric: '4 - 7'
        }
      }));
    });

    it('should validate breed array operations', () => {
      const breed1: Breed = {
        id: 'abys',
        name: 'Abyssinian',
        description: 'Active cat',
        temperament: 'Active, Energetic',
        origin: 'Egypt',
        life_span: '14 - 15',
        weight: { imperial: '7 - 10', metric: '3 - 5' }
      };

      const breed2: Breed = {
        id: 'beng',
        name: 'Bengal',
        description: 'Athletic cat',
        temperament: 'Alert, Agile',
        origin: 'United States',
        life_span: '14 - 16',
        weight: { imperial: '8 - 15', metric: '4 - 7' }
      };

      const cat: Cat = {
        id: 'cat789',
        url: 'https://example.com/mixed.jpg',
        width: 800,
        height: 600,
        breeds: [breed1, breed2]
      };

      // Test array operations
      expect(cat.breeds).toHaveLength(2);
      expect(cat.breeds!.map(b => b.id)).toEqual(['abys', 'beng']);
      expect(cat.breeds!.find(b => b.id === 'abys')).toEqual(breed1);
      expect(cat.breeds!.some(b => b.origin === 'Egypt')).toBe(true);
      expect(cat.breeds!.every(b => typeof b.name === 'string')).toBe(true);
    });
  });
});