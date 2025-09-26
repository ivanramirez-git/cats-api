import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../adapters/jwt/JwtService';
import { UserRole } from '../../domain/entities/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

export class AuthMiddleware {
  constructor(private jwtService: JwtService) {}

  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token de acceso requerido' });
        return;
      }

      const token = authHeader.substring(7);
      const payload = await this.jwtService.verifyToken(token);
      
      req.user = payload;
      next();
    } catch (error: any) {
      let errorMessage = 'Token inválido';
      
      if (error.message === 'Token expirado') {
        errorMessage = 'Token expirado';
      } else if (error.message === 'Usuario no encontrado') {
        errorMessage = 'Usuario no encontrado';
      } else if (error.message === 'Token inválido - datos inconsistentes') {
        errorMessage = 'Token inválido';
      }
      
      res.status(401).json({ error: errorMessage });
    }
  };

  authorize = (roles: UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({ error: 'Acceso denegado' });
        return;
      }

      next();
    };
  };
}