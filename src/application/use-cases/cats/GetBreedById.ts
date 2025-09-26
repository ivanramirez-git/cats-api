import { ICatRepository } from '../../../domain/repositories/ICatRepository';
import { Breed } from '../../../domain/entities/Breed';

export class GetBreedById {
  constructor(private catRepository: ICatRepository) {}

  async execute(breedId: string): Promise<Breed | null> {
    return this.catRepository.getBreedById(breedId);
  }
}