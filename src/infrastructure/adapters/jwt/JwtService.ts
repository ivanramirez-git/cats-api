import jwt, { SignOptions } from 'jsonwebtoken';
import { appConfig } from '../../../config/config';
import { UserRole } from '../../../domain/entities/User';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export class JwtService {
  generateToken(payload: JwtPayload): string {
    const tokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };
    
    return jwt.sign(tokenPayload, appConfig.jwtSecret, {
      expiresIn: appConfig.jwtExpiresIn as any
    });
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, appConfig.jwtSecret) as JwtPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Token inválido');
      } else {
        throw new Error('Error al verificar token');
      }
    }
  }
}