import axios from 'axios';
import { appConfig } from '../../../config/config';
import { Breed } from '../../../domain/entities/Breed';
import { Cat } from '../../../domain/entities/Cat';

export class CatApiClient {
  private client: any;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.thecatapi.com/v1',
      headers: {
        'x-api-key': appConfig.catApiKey
      }
    });
  }

  async getBreeds(): Promise<Breed[]> {
    const response = await this.client.get('/breeds');
    return response.data;
  }

  async getBreedById(breedId: string): Promise<Breed | null> {
    try {
      const response = await this.client.get(`/breeds/${breedId}`);
      // If response is "INVALID_DATA" string, return null
      if (typeof response.data === 'string' && response.data === 'INVALID_DATA') {
        return null;
      }
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      // Handle cases where API returns non-JSON response
      if (error.response?.data === 'INVALID_DATA') {
        return null;
      }
      throw error;
    }
  }

  async searchBreeds(query: string): Promise<Breed[]> {
    // La API de TheCatAPI solo busca por nombre, pero necesitamos buscar por nombre, origen o temperamento
    // Por lo tanto, obtenemos todas las razas y filtramos localmente
    const allBreeds = await this.getBreeds();
    const queryLower = query.toLowerCase();
    
    return allBreeds.filter(breed => 
      breed.name.toLowerCase().includes(queryLower) ||
      breed.origin?.toLowerCase().includes(queryLower) ||
      breed.temperament?.toLowerCase().includes(queryLower)
    );
  }

  async getImagesByBreedId(breedId: string, limit: number): Promise<Cat[]> {
    const response = await this.client.get(`/images/search?breed_ids=${breedId}&limit=${limit}`);
    return response.data;
  }
}