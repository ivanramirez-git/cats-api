import jwt, { SignOptions } from 'jsonwebtoken';
import { appConfig } from '../../../config/config';
import { UserRole } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export class JwtService {
  constructor(private userRepository: IUserRepository) {}

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

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const payload = jwt.verify(token, appConfig.jwtSecret) as JwtPayload;
      
      // Verificar que el usuario aún existe en la base de datos
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar que los datos del token coincidan con los datos actuales del usuario
      if (user.email !== payload.email) {
        throw new Error('Token inválido - datos inconsistentes');
      }
      
      return payload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Token inválido');
      } else if (error.message === 'Usuario no encontrado' || error.message === 'Token inválido - datos inconsistentes') {
        throw error;
      } else {
        throw new Error('Error al verificar token');
      }
    }
  }
}