import { ICatRepository } from '../../../domain/repositories/ICatRepository';
import { Breed } from '../../../domain/entities/Breed';
import { Cat } from '../../../domain/entities/Cat';
import { CatApiClient } from '../api-client/CatApiClient';

export class CatRepository implements ICatRepository {
  constructor(private catApiClient: CatApiClient) {}

  async getBreeds(): Promise<Breed[]> {
    return this.catApiClient.getBreeds();
  }

  async getBreedById(breedId: string): Promise<Breed | null> {
    return this.catApiClient.getBreedById(breedId);
  }

  async searchBreeds(query: string): Promise<Breed[]> {
    return this.catApiClient.searchBreeds(query);
  }

  async getImagesByBreedId(breedId: string, limit: number = 10): Promise<Cat[]> {
    return this.catApiClient.getImagesByBreedId(breedId, limit);
  }
}