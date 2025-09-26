import { ICatRepository } from '../../../domain/repositories/ICatRepository';
import { Breed } from '../../../domain/entities/Breed';
import { ValidationError } from '../../../domain/exceptions/ApplicationError';

export class GetBreedById {
  constructor(private catRepository: ICatRepository) {}

  async execute(breedId: string): Promise<Breed | null> {
    if (!breedId || breedId.trim().length === 0) {
      throw new ValidationError('ID de raza requerido');
    }
    
    return this.catRepository.getBreedById(breedId);
  }
}