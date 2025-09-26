import { ICatRepository } from '../../../domain/repositories/ICatRepository';
import { Breed } from '../../../domain/entities/Breed';
import { ValidationError } from '../../../domain/exceptions/ApplicationError';

export class SearchBreeds {
  constructor(private catRepository: ICatRepository) {}

  async execute(query: string): Promise<Breed[]> {
    if (!query || query.trim().length === 0) {
      throw new ValidationError('Query de búsqueda requerido');
    }
    return this.catRepository.searchBreeds(query.trim());
  }
}