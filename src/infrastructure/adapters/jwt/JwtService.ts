import jwt from 'jsonwebtoken';
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
    return jwt.sign(tokenPayload, appConfig.jwtSecret);
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, appConfig.jwtSecret) as JwtPayload;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
}