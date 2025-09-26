import { Request, Response, NextFunction } from 'express';
import { GetImagesByBreedId } from '../../application/use-cases/images/GetImagesByBreedId';

export class ImageController {
  constructor(
    private getImagesByBreedIdUseCase: GetImagesByBreedId
  ) {}

  getImagesByBreedId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { breed_id } = req.query;
      const { limit } = req.query;
      
      if (!breed_id) {
        res.status(400).json({ error: 'breed_id es requerido como parámetro de consulta' });
        return;
      }
      
      const images = await this.getImagesByBreedIdUseCase.execute(
        breed_id as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(images);
    } catch (error) {
      next(error);
    }
  };
}