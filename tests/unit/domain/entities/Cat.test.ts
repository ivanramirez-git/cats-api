import { Cat, Breed } from '../../../../src/domain/entities/Cat';

describe('Cat Domain Entity', () => {
  describe('Cat interface', () => {
    it('should accept valid cat object with all properties', () => {
      const validCat: Cat = {
        id: 'MTY3ODIyMQ',
        url: 'https://cdn2.thecatapi.com/images/MTY3ODIyMQ.jpg',
        width: 1204,
        height: 1445,
        breeds: [
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
            }
          }
        ]
      };

      expect(validCat.id).toBe('MTY3ODIyMQ');
      expect(validCat.url).toBe('https://cdn2.thecatapi.com/images/MTY3ODIyMQ.jpg');
      expect(validCat.width).toBe(1204);
      expect(validCat.height).toBe(1445);
      expect(validCat.breeds).toHaveLength(1);
      expect(validCat.breeds![0].name).toBe('Abyssinian');
    });

    it('should accept cat without breeds', () => {
      const catWithoutBreeds: Cat = {
        id: 'test123',
        url: 'https://example.com/cat.jpg',
        width: 800,
        height: 600
      };

      expect(catWithoutBreeds.id).toBe('test123');
      expect(catWithoutBreeds.url).toBe('https://example.com/cat.jpg');
      expect(catWithoutBreeds.width).toBe(800);
      expect(catWithoutBreeds.height).toBe(600);
      expect(catWithoutBreeds.breeds).toBeUndefined();
    });

    it('should accept cat with empty breeds array', () => {
      const catWithEmptyBreeds: Cat = {
        id: 'test456',
        url: 'https://example.com/cat2.jpg',
        width: 1000,
        height: 800,
        breeds: []
      };

      expect(catWithEmptyBreeds.breeds).toEqual([]);
      expect(catWithEmptyBreeds.breeds).toHaveLength(0);
    });

    it('should have all required properties', () => {
      const cat: Cat = {
        id: 'test-id',
        url: 'https://test.com/image.jpg',
        width: 500,
        height: 400
      };

      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('url');
      expect(cat).toHaveProperty('width');
      expect(cat).toHaveProperty('height');
    });

    it('should accept multiple breeds', () => {
      const catWithMultipleBreeds: Cat = {
        id: 'multi123',
        url: 'https://example.com/multi-breed-cat.jpg',
        width: 1200,
        height: 900,
        breeds: [
          {
            id: 'pers',
            name: 'Persian',
            description: 'Persian cat description',
            temperament: 'Calm, Gentle',
            origin: 'Iran',
            life_span: '12 - 17',
            weight: { imperial: '7 - 12', metric: '3 - 5' }
          },
          {
            id: 'siam',
            name: 'Siamese',
            description: 'Siamese cat description',
            temperament: 'Active, Social',
            origin: 'Thailand',
            life_span: '12 - 15',
            weight: { imperial: '6 - 14', metric: '3 - 6' }
          }
        ]
      };

      expect(catWithMultipleBreeds.breeds).toHaveLength(2);
      expect(catWithMultipleBreeds.breeds![0].name).toBe('Persian');
      expect(catWithMultipleBreeds.breeds![1].name).toBe('Siamese');
    });
  });

  describe('Breed interface (within Cat)', () => {
    it('should accept valid breed object', () => {
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

      expect(breed.id).toBe('test');
      expect(breed.name).toBe('Test Breed');
      expect(breed.weight.imperial).toBe('5 - 10');
      expect(breed.weight.metric).toBe('2 - 5');
    });

    it('should have all required breed properties', () => {
      const breed: Breed = {
        id: 'req-test',
        name: 'Required Test',
        description: 'Required description',
        temperament: 'Required temperament',
        origin: 'Required origin',
        life_span: '10 - 12',
        weight: {
          imperial: '5 - 8',
          metric: '2 - 4'
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

    it('should have weight with imperial and metric', () => {
      const breed: Breed = {
        id: 'weight-test',
        name: 'Weight Test',
        description: 'Test',
        temperament: 'Test',
        origin: 'Test',
        life_span: '10 - 15',
        weight: {
          imperial: '6 - 12',
          metric: '3 - 6'
        }
      };

      expect(breed.weight).toHaveProperty('imperial');
      expect(breed.weight).toHaveProperty('metric');
      expect(typeof breed.weight.imperial).toBe('string');
      expect(typeof breed.weight.metric).toBe('string');
    });
  });

  describe('Real cat examples', () => {
    it('should handle cat with Abyssinian breed', () => {
      const abyssinianCat: Cat = {
        id: 'abys_001',
        url: 'https://cdn2.thecatapi.com/images/abys_001.jpg',
        width: 1200,
        height: 800,
        breeds: [
          {
            id: 'abys',
            name: 'Abyssinian',
            description: 'The Abyssinian is easy to care for, and a joy to have in your home. They\'re affectionate cats and love both people and other animals.',
            temperament: 'Active, Energetic, Independent, Intelligent, Gentle',
            origin: 'Egypt',
            life_span: '14 - 15',
            weight: {
              imperial: '7  -  10',
              metric: '3 - 5'
            }
          }
        ]
      };

      expect(abyssinianCat.breeds![0].name).toBe('Abyssinian');
      expect(abyssinianCat.breeds![0].origin).toBe('Egypt');
      expect(abyssinianCat.breeds![0].temperament).toContain('Active');
    });

    it('should handle cat with Persian breed', () => {
      const persianCat: Cat = {
        id: 'pers_001',
        url: 'https://cdn2.thecatapi.com/images/pers_001.jpg',
        width: 1000,
        height: 1200,
        breeds: [
          {
            id: 'pers',
            name: 'Persian',
            description: 'The Persian cat is a long-haired breed of cat characterized by its round face and short muzzle.',
            temperament: 'Affectionate, Docile, Quiet, Gentle, Calm',
            origin: 'Iran (Persia)',
            life_span: '14 - 15',
            weight: {
              imperial: '7 - 12',
              metric: '3 - 5'
            }
          }
        ]
      };

      expect(persianCat.breeds![0].name).toBe('Persian');
      expect(persianCat.breeds![0].origin).toBe('Iran (Persia)');
      expect(persianCat.breeds![0].temperament).toContain('Affectionate');
    });

    it('should handle random cat without breed information', () => {
      const randomCat: Cat = {
        id: 'random_123',
        url: 'https://cdn2.thecatapi.com/images/random_123.jpg',
        width: 800,
        height: 600
      };

      expect(randomCat.id).toBe('random_123');
      expect(randomCat.url).toContain('cdn2.thecatapi.com');
      expect(randomCat.breeds).toBeUndefined();
    });
  });

  describe('Image properties validation', () => {
    it('should handle different image dimensions', () => {
      const cats: Cat[] = [
        {
          id: 'square',
          url: 'https://example.com/square.jpg',
          width: 500,
          height: 500
        },
        {
          id: 'landscape',
          url: 'https://example.com/landscape.jpg',
          width: 1920,
          height: 1080
        },
        {
          id: 'portrait',
          url: 'https://example.com/portrait.jpg',
          width: 600,
          height: 800
        }
      ];

      cats.forEach(cat => {
        expect(typeof cat.width).toBe('number');
        expect(typeof cat.height).toBe('number');
        expect(cat.width).toBeGreaterThan(0);
        expect(cat.height).toBeGreaterThan(0);
      });
    });

    it('should handle very large image dimensions', () => {
      const largeCat: Cat = {
        id: 'large_image',
        url: 'https://example.com/large.jpg',
        width: 4000,
        height: 3000
      };

      expect(largeCat.width).toBe(4000);
      expect(largeCat.height).toBe(3000);
      expect(largeCat.width).toBeGreaterThan(1000);
      expect(largeCat.height).toBeGreaterThan(1000);
    });

    it('should handle small image dimensions', () => {
      const smallCat: Cat = {
        id: 'small_image',
        url: 'https://example.com/small.jpg',
        width: 100,
        height: 150
      };

      expect(smallCat.width).toBe(100);
      expect(smallCat.height).toBe(150);
      expect(smallCat.width).toBeLessThan(200);
      expect(smallCat.height).toBeLessThan(200);
    });
  });

  describe('URL validation', () => {
    it('should handle different URL formats', () => {
      const cats: Cat[] = [
        {
          id: 'cdn1',
          url: 'https://cdn2.thecatapi.com/images/test1.jpg',
          width: 500,
          height: 400
        },
        {
          id: 'cdn2',
          url: 'https://cdn2.thecatapi.com/images/test2.png',
          width: 600,
          height: 500
        },
        {
          id: 'other',
          url: 'https://example.com/cat.jpeg',
          width: 700,
          height: 600
        }
      ];

      cats.forEach(cat => {
        expect(cat.url).toMatch(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i);
      });
    });

    it('should handle long URLs', () => {
      const longUrlCat: Cat = {
        id: 'long_url',
        url: 'https://very.long.domain.name.example.com/path/to/very/deep/directory/structure/with/long/filename.jpg',
        width: 800,
        height: 600
      };

      expect(longUrlCat.url.length).toBeGreaterThan(50);
      expect(longUrlCat.url).toContain('https://');
      expect(longUrlCat.url).toContain('.jpg');
    });
  });

  describe('Edge cases', () => {
    it('should handle cat with breed having special characters', () => {
      const specialCat: Cat = {
        id: 'special_123',
        url: 'https://example.com/special.jpg',
        width: 800,
        height: 600,
        breeds: [
          {
            id: 'special',
            name: 'Café Breed',
            description: 'A breed with special characters: àáâãäåæçèéêë',
            temperament: 'Énergique, Intelligent, Sociable',
            origin: 'François, Île-de-France',
            life_span: '12 - 16',
            weight: {
              imperial: '6 - 10',
              metric: '3 - 5'
            }
          }
        ]
      };

      expect(specialCat.breeds![0].name).toBe('Café Breed');
      expect(specialCat.breeds![0].description).toContain('àáâãäåæçèéêë');
      expect(specialCat.breeds![0].origin).toBe('François, Île-de-France');
    });

    it('should handle cat ID with different formats', () => {
      const cats: Cat[] = [
        {
          id: 'MTY3ODIyMQ', // Base64-like
          url: 'https://example.com/1.jpg',
          width: 500,
          height: 400
        },
        {
          id: 'abc123def456', // Alphanumeric
          url: 'https://example.com/2.jpg',
          width: 600,
          height: 500
        },
        {
          id: '12345', // Numeric
          url: 'https://example.com/3.jpg',
          width: 700,
          height: 600
        }
      ];

      cats.forEach(cat => {
        expect(typeof cat.id).toBe('string');
        expect(cat.id.length).toBeGreaterThan(0);
      });
    });

    it('should handle extreme aspect ratios', () => {
      const extremeCats: Cat[] = [
        {
          id: 'wide',
          url: 'https://example.com/wide.jpg',
          width: 2000,
          height: 100 // Very wide
        },
        {
          id: 'tall',
          url: 'https://example.com/tall.jpg',
          width: 100,
          height: 2000 // Very tall
        }
      ];

      extremeCats.forEach(cat => {
        const aspectRatio = cat.width / cat.height;
        expect(aspectRatio).toBeGreaterThan(0);
        expect(typeof aspectRatio).toBe('number');
      });
    });
  });
});