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
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async searchBreeds(query: string): Promise<Breed[]> {
    const response = await this.client.get(`/breeds/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async getImagesByBreedId(breedId: string, limit: number): Promise<Cat[]> {
    const response = await this.client.get(`/images/search?breed_ids=${breedId}&limit=${limit}`);
    return response.data;
  }
}