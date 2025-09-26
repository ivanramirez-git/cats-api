import axios from 'axios';
import { CatApiClient } from '../../../../../src/infrastructure/adapters/api-client/CatApiClient';
import { Breed } from '../../../../../src/domain/entities/Breed';
import { Cat } from '../../../../../src/domain/entities/Cat';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock config
jest.mock('../../../../../src/config/config', () => ({
  appConfig: {
    catApiKey: 'test-api-key'
  }
}));

describe('CatApiClient', () => {
  let catApiClient: CatApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock axios instance
    mockAxiosInstance = {
      get: jest.fn()
    };
    
    // Mock axios.create to return our mock instance
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
    
    catApiClient = new CatApiClient();
  });

  describe('constructor', () => {
    it('should create axios instance with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.thecatapi.com/v1',
        headers: {
          'x-api-key': 'test-api-key'
        }
      });
    });
  });

  describe('getBreeds', () => {
    it('should return breeds from API', async () => {
      const mockBreeds: Breed[] = [
        {
          id: 'abys',
          name: 'Abyssinian',
          description: 'The Abyssinian is easy to care for',
          temperament: 'Active, Energetic, Independent',
          origin: 'Egypt',
          life_span: '14 - 15',
          weight: {
            imperial: '7  -  10',
            metric: '3 - 5'
          }
        },
        {
          id: 'aege',
          name: 'Aegean',
          description: 'Native to the Greek islands',
          temperament: 'Affectionate, Social, Intelligent',
          origin: 'Greece',
          life_span: '9 - 12',
          weight: {
            imperial: '7 - 10',
            metric: '3 - 5'
          }
        }
      ];

      mockAxiosInstance.get.mockResolvedValue({ data: mockBreeds });

      const result = await catApiClient.getBreeds();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/breeds');
      expect(result).toEqual(mockBreeds);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(catApiClient.getBreeds()).rejects.toThrow('API Error');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/breeds');
    });

    it('should return empty array when API returns empty data', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      const result = await catApiClient.getBreeds();

      expect(result).toEqual([]);
    });
  });

  describe('getBreedById', () => {
    it('should return breed when found', async () => {
      const mockBreed: Breed = {
        id: 'abys',
        name: 'Abyssinian',
        description: 'The Abyssinian is easy to care for',
        temperament: 'Active, Energetic, Independent',
        origin: 'Egypt',
        life_span: '14 - 15',
        weight: {
          imperial: '7  -  10',
          metric: '3 - 5'
        }
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockBreed });

      const result = await catApiClient.getBreedById('abys');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/breeds/abys');
      expect(result).toEqual(mockBreed);
    });

    it('should return null when breed not found (404)', async () => {
      const error = {
        response: {
          status: 404
        }
      };
      mockAxiosInstance.get.mockRejectedValue(error);

      const result = await catApiClient.getBreedById('nonexistent');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/breeds/nonexistent');
      expect(result).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      const error = {
        response: {
          status: 500
        },
        message: 'Internal Server Error'
      };
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(catApiClient.getBreedById('abys')).rejects.toEqual(error);
    });

    it('should throw error when no response object', async () => {
      const error = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(catApiClient.getBreedById('abys')).rejects.toThrow('Network Error');
    });
  });

  describe('searchBreeds', () => {
    it('should search breeds with encoded query', async () => {
      const mockBreeds: Breed[] = [
        {
          id: 'abys',
          name: 'Abyssinian',
          description: 'The Abyssinian is easy to care for',
          temperament: 'Active, Energetic, Independent',
          origin: 'Egypt',
          life_span: '14 - 15',
          weight: {
            imperial: '7  -  10',
            metric: '3 - 5'
          }
        }
      ];

      mockAxiosInstance.get.mockResolvedValue({ data: mockBreeds });

      const result = await catApiClient.searchBreeds('Abyssinian');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/breeds/search?q=Abyssinian');
      expect(result).toEqual(mockBreeds);
    });

    it('should properly encode special characters in query', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      await catApiClient.searchBreeds('Maine Coon & Persian');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/breeds/search?q=Maine%20Coon%20%26%20Persian');
    });

    it('should handle empty search results', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      const result = await catApiClient.searchBreeds('nonexistent');

      expect(result).toEqual([]);
    });

    it('should handle search API errors', async () => {
      const error = new Error('Search API Error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(catApiClient.searchBreeds('test')).rejects.toThrow('Search API Error');
    });
  });

  describe('getImagesByBreedId', () => {
    it('should return cat images for breed', async () => {
      const mockCats: Cat[] = [
        {
          id: 'cat1',
          url: 'https://cdn2.thecatapi.com/images/cat1.jpg',
          width: 1200,
          height: 800,
          breeds: [
            {
              id: 'abys',
              name: 'Abyssinian',
              description: 'The Abyssinian is easy to care for',
              temperament: 'Active, Energetic, Independent',
              origin: 'Egypt',
              life_span: '14 - 15',
              weight: {
                imperial: '7  -  10',
                metric: '3 - 5'
              }
            }
          ]
        },
        {
          id: 'cat2',
          url: 'https://cdn2.thecatapi.com/images/cat2.jpg',
          width: 1000,
          height: 750,
          breeds: []
        }
      ];

      mockAxiosInstance.get.mockResolvedValue({ data: mockCats });

      const result = await catApiClient.getImagesByBreedId('abys', 10);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/images/search?breed_ids=abys&limit=10');
      expect(result).toEqual(mockCats);
    });

    it('should handle different limit values', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      await catApiClient.getImagesByBreedId('abys', 5);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/images/search?breed_ids=abys&limit=5');

      await catApiClient.getImagesByBreedId('pers', 20);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/images/search?breed_ids=pers&limit=20');
    });

    it('should return empty array when no images found', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      const result = await catApiClient.getImagesByBreedId('abys', 10);

      expect(result).toEqual([]);
    });

    it('should handle images API errors', async () => {
      const error = new Error('Images API Error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(catApiClient.getImagesByBreedId('abys', 10)).rejects.toThrow('Images API Error');
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle very long breed IDs', async () => {
      const longBreedId = 'a'.repeat(100);
      mockAxiosInstance.get.mockResolvedValue({ data: null });

      await catApiClient.getBreedById(longBreedId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/breeds/${longBreedId}`);
    });

    it('should handle special characters in breed IDs', async () => {
      const specialBreedId = 'breed-with_special.chars';
      mockAxiosInstance.get.mockResolvedValue({ data: null });

      await catApiClient.getBreedById(specialBreedId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/breeds/${specialBreedId}`);
    });

    it('should handle zero limit for images', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      await catApiClient.getImagesByBreedId('abys', 0);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/images/search?breed_ids=abys&limit=0');
    });

    it('should handle negative limit for images', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      await catApiClient.getImagesByBreedId('abys', -1);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/images/search?breed_ids=abys&limit=-1');
    });
  });
});