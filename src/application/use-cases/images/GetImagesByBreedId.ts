import { ICatRepository } from '../../../domain/repositories/ICatRepository';
import { Cat } from '../../../domain/entities/Cat';

export class GetImagesByBreedId {
  constructor(private catRepository: ICatRepository) {}

  async execute(breedId: string, limit: number = 10): Promise<Cat[]> {
    if (!breedId || breedId.trim().length === 0) {
      throw new Error('ID de raza requerido');
    }
    
    if (limit <= 0 || limit > 100) {
      throw new Error('Límite debe estar entre 1 y 100');
    }

    return this.catRepository.getImagesByBreedId(breedId.trim(), limit);
  }
}