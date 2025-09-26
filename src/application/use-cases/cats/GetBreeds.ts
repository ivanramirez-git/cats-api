import { ICatRepository } from '../../../domain/repositories/ICatRepository';
import { Breed } from '../../../domain/entities/Breed';

export class GetBreeds {
  constructor(private catRepository: ICatRepository) {}

  async execute(): Promise<Breed[]> {
    return this.catRepository.getBreeds();
  }
}