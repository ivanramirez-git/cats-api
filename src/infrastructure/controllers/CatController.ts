import { Request, Response, NextFunction } from 'express';
import { GetBreeds } from '../../application/use-cases/cats/GetBreeds';
import { GetBreedById } from '../../application/use-cases/cats/GetBreedById';
import { SearchBreeds } from '../../application/use-cases/cats/SearchBreeds';

export class CatController {
  constructor(
    private getBreedsUseCase: GetBreeds,
    private getBreedByIdUseCase: GetBreedById,
    private searchBreedsUseCase: SearchBreeds
  ) {}

  getBreeds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const breeds = await this.getBreedsUseCase.execute();
      res.json(breeds);
    } catch (error) {
      next(error);
    }
  };

  getBreedById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { breed_id } = req.params;
      const breed = await this.getBreedByIdUseCase.execute(breed_id);
      
      if (!breed) {
        res.status(404).json({ error: 'Raza no encontrada' });
        return;
      }
      
      res.json(breed);
    } catch (error) {
      next(error);
    }
  };

  searchBreeds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;
      const breeds = await this.searchBreedsUseCase.execute(q as string);
      res.json(breeds);
    } catch (error) {
      next(error);
    }
  };
}