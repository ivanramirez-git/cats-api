import { Breed } from '../entities/Breed';
import { Cat } from '../entities/Cat';

export interface ICatRepository {
  getBreeds(): Promise<Breed[]>;
  getBreedById(breedId: string): Promise<Breed | null>;
  searchBreeds(query: string): Promise<Breed[]>;
  getImagesByBreedId(breedId: string, limit?: number): Promise<Cat[]>;
}