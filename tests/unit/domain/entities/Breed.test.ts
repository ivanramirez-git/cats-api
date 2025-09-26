import { Breed } from '../../../../src/domain/entities/Breed';

describe('Breed Domain Entity', () => {
  describe('Breed interface', () => {
    it('should accept valid breed object with all properties', () => {
      const validBreed: Breed = {
        id: 'abys',
        name: 'Abyssinian',
        description: 'The Abyssinian is easy to care for, and a joy to have in your home. They\'re affectionate cats and love both people and other animals.',
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

      expect(validBreed.id).toBe('abys');
      expect(validBreed.name).toBe('Abyssinian');
      expect(validBreed.description).toContain('Abyssinian');
      expect(validBreed.temperament).toContain('Active');
      expect(validBreed.origin).toBe('Egypt');
      expect(validBreed.life_span).toBe('14 - 15');
      expect(validBreed.weight.imperial).toBe('7  -  10');
      expect(validBreed.weight.metric).toBe('3 - 5');
      expect(validBreed.wikipedia_url).toContain('wikipedia.org');
      expect(validBreed.reference_image_id).toBe('0XYvRd7oD');
    });

    it('should accept breed with minimal properties', () => {
      const minimalBreed: Breed = {
        id: 'test',
        name: 'Test Breed',
        description: 'A test breed',
        temperament: 'Calm',
        origin: 'Unknown',
        life_span: '10 - 15',
        weight: {
          imperial: '5 - 8',
          metric: '2 - 4'
        }
      };

      expect(minimalBreed.id).toBe('test');
      expect(minimalBreed.name).toBe('Test Breed');
      expect(minimalBreed.wikipedia_url).toBeUndefined();
      expect(minimalBreed.reference_image_id).toBeUndefined();
    });

    it('should have all required properties', () => {
      const breed: Breed = {
        id: 'test-id',
        name: 'Test Cat',
        description: 'Test description',
        temperament: 'Test temperament',
        origin: 'Test origin',
        life_span: '10 - 12',
        weight: {
          imperial: '5 - 10',
          metric: '2 - 5'
        }
      };

      expect(breed).toHaveProperty('id');
      expect(breed).toHaveProperty('name');
      expect(breed).toHaveProperty('description');
      expect(breed).toHaveProperty('temperament');
      expect(breed).toHaveProperty('origin');
      expect(breed).toHaveProperty('life_span');
      expect(breed).toHaveProperty('weight');
    });

    it('should have weight object with imperial and metric', () => {
      const breed: Breed = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        temperament: 'Test',
        origin: 'Test',
        life_span: '10 - 15',
        weight: {
          imperial: '8 - 12',
          metric: '4 - 6'
        }
      };

      expect(breed.weight).toHaveProperty('imperial');
      expect(breed.weight).toHaveProperty('metric');
      expect(typeof breed.weight.imperial).toBe('string');
      expect(typeof breed.weight.metric).toBe('string');
    });

    it('should allow optional wikipedia_url', () => {
      const breedWithUrl: Breed = {
        id: 'test1',
        name: 'Test 1',
        description: 'Test',
        temperament: 'Test',
        origin: 'Test',
        life_span: '10 - 15',
        weight: { imperial: '5 - 8', metric: '2 - 4' },
        wikipedia_url: 'https://en.wikipedia.org/wiki/Test_cat'
      };

      const breedWithoutUrl: Breed = {
        id: 'test2',
        name: 'Test 2',
        description: 'Test',
        temperament: 'Test',
        origin: 'Test',
        life_span: '10 - 15',
        weight: { imperial: '5 - 8', metric: '2 - 4' }
      };

      expect(breedWithUrl.wikipedia_url).toBe('https://en.wikipedia.org/wiki/Test_cat');
      expect(breedWithoutUrl.wikipedia_url).toBeUndefined();
    });

    it('should allow optional reference_image_id', () => {
      const breedWithImage: Breed = {
        id: 'test1',
        name: 'Test 1',
        description: 'Test',
        temperament: 'Test',
        origin: 'Test',
        life_span: '10 - 15',
        weight: { imperial: '5 - 8', metric: '2 - 4' },
        reference_image_id: 'abc123'
      };

      const breedWithoutImage: Breed = {
        id: 'test2',
        name: 'Test 2',
        description: 'Test',
        temperament: 'Test',
        origin: 'Test',
        life_span: '10 - 15',
        weight: { imperial: '5 - 8', metric: '2 - 4' }
      };

      expect(breedWithImage.reference_image_id).toBe('abc123');
      expect(breedWithoutImage.reference_image_id).toBeUndefined();
    });
  });

  describe('Real breed examples', () => {
    it('should handle Persian breed data', () => {
      const persian: Breed = {
        id: 'pers',
        name: 'Persian',
        description: 'The Persian cat is a long-haired breed of cat characterized by its round face and short muzzle.',
        temperament: 'Affectionate, Docile, Quiet, Gentle, Calm',
        origin: 'Iran (Persia)',
        life_span: '14 - 15',
        weight: {
          imperial: '7 - 12',
          metric: '3 - 5'
        },
        wikipedia_url: 'https://en.wikipedia.org/wiki/Persian_cat',
        reference_image_id: 'pers123'
      };

      expect(persian.name).toBe('Persian');
      expect(persian.origin).toBe('Iran (Persia)');
      expect(persian.temperament).toContain('Affectionate');
    });

    it('should handle Siamese breed data', () => {
      const siamese: Breed = {
        id: 'siam',
        name: 'Siamese',
        description: 'The Siamese cat is one of the first distinctly recognized breeds of Asian cat.',
        temperament: 'Active, Agile, Clever, Sociable, Loving, Energetic',
        origin: 'Thailand',
        life_span: '12 - 15',
        weight: {
          imperial: '6 - 14',
          metric: '3 - 6'
        },
        wikipedia_url: 'https://en.wikipedia.org/wiki/Siamese_cat'
      };

      expect(siamese.name).toBe('Siamese');
      expect(siamese.origin).toBe('Thailand');
      expect(siamese.temperament).toContain('Active');
      expect(siamese.reference_image_id).toBeUndefined();
    });

    it('should handle Maine Coon breed data', () => {
      const maineCoon: Breed = {
        id: 'mcoo',
        name: 'Maine Coon',
        description: 'The Maine Coon is a large domesticated cat breed.',
        temperament: 'Adaptable, Intelligent, Loving, Gentle, Independent',
        origin: 'United States',
        life_span: '12 - 15',
        weight: {
          imperial: '12 - 18',
          metric: '5 - 8'
        },
        wikipedia_url: 'https://en.wikipedia.org/wiki/Maine_Coon',
        reference_image_id: 'mcoo456'
      };

      expect(maineCoon.name).toBe('Maine Coon');
      expect(maineCoon.origin).toBe('United States');
      expect(maineCoon.weight.imperial).toBe('12 - 18');
      expect(maineCoon.weight.metric).toBe('5 - 8');
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle long descriptions', () => {
      const longDescription = 'This is a very long description that contains multiple sentences about the breed. '.repeat(10);
      const breed: Breed = {
        id: 'long',
        name: 'Long Description Breed',
        description: longDescription,
        temperament: 'Calm',
        origin: 'Test',
        life_span: '10 - 15',
        weight: { imperial: '5 - 8', metric: '2 - 4' }
      };

      expect(breed.description.length).toBeGreaterThan(500);
      expect(breed.description).toContain('very long description');
    });

    it('should handle multiple temperament traits', () => {
      const breed: Breed = {
        id: 'multi',
        name: 'Multi Temperament',
        description: 'Test',
        temperament: 'Active, Energetic, Independent, Intelligent, Gentle, Loving, Playful, Social',
        origin: 'Test',
        life_span: '10 - 15',
        weight: { imperial: '5 - 8', metric: '2 - 4' }
      };

      const traits = breed.temperament.split(', ');
      expect(traits.length).toBeGreaterThan(5);
      expect(traits).toContain('Active');
      expect(traits).toContain('Gentle');
    });

    it('should handle different life span formats', () => {
      const breeds: Breed[] = [
        {
          id: 'test1',
          name: 'Test 1',
          description: 'Test',
          temperament: 'Test',
          origin: 'Test',
          life_span: '12 - 15',
          weight: { imperial: '5 - 8', metric: '2 - 4' }
        },
        {
          id: 'test2',
          name: 'Test 2',
          description: 'Test',
          temperament: 'Test',
          origin: 'Test',
          life_span: '10-14',
          weight: { imperial: '5 - 8', metric: '2 - 4' }
        },
        {
          id: 'test3',
          name: 'Test 3',
          description: 'Test',
          temperament: 'Test',
          origin: 'Test',
          life_span: '15+',
          weight: { imperial: '5 - 8', metric: '2 - 4' }
        }
      ];

      breeds.forEach(breed => {
        expect(typeof breed.life_span).toBe('string');
        expect(breed.life_span.length).toBeGreaterThan(0);
      });
    });

    it('should handle different weight formats', () => {
      const breed: Breed = {
        id: 'weight',
        name: 'Weight Test',
        description: 'Test',
        temperament: 'Test',
        origin: 'Test',
        life_span: '10 - 15',
        weight: {
          imperial: '8  -  12', // Extra spaces
          metric: '4-6' // No spaces
        }
      };

      expect(breed.weight.imperial).toBe('8  -  12');
      expect(breed.weight.metric).toBe('4-6');
    });

    it('should handle special characters in names and origins', () => {
      const breed: Breed = {
        id: 'special',
        name: 'Café au Lait',
        description: 'A breed with special characters',
        temperament: 'Énergique, Intelligent',
        origin: 'François, Île-de-France',
        life_span: '12 - 16',
        weight: { imperial: '6 - 10', metric: '3 - 5' }
      };

      expect(breed.name).toBe('Café au Lait');
      expect(breed.origin).toBe('François, Île-de-France');
      expect(breed.temperament).toBe('Énergique, Intelligent');
    });

    it('should handle empty optional fields', () => {
      const breed: Breed = {
        id: 'minimal',
        name: 'Minimal Breed',
        description: 'Minimal description',
        temperament: 'Calm',
        origin: 'Unknown',
        life_span: '10 - 15',
        weight: { imperial: '5 - 8', metric: '2 - 4' },
        wikipedia_url: undefined,
        reference_image_id: undefined
      };

      expect(breed.wikipedia_url).toBeUndefined();
      expect(breed.reference_image_id).toBeUndefined();
    });
  });
});