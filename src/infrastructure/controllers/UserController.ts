import { Request, Response, NextFunction } from 'express';
import { RegisterUser } from '../../application/use-cases/users/RegisterUser';
import { LoginUser } from '../../application/use-cases/users/LoginUser';

export class UserController {
  constructor(
    private registerUserUseCase: RegisterUser,
    private loginUserUseCase: LoginUser
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.registerUserUseCase.execute({ email, password });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.loginUserUseCase.execute({ email, password });
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}