import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { CreateUserRequest, User, UserRole, AuthResponse } from '../../../domain/entities/User';
import { PasswordService } from '../../services/PasswordService';
import { JwtService } from '../../../infrastructure/adapters/jwt/JwtService';
import { ValidationError, ConflictError } from '../../../domain/exceptions/ApplicationError';

export class RegisterUser {
  constructor(
    private userRepository: IUserRepository,
    private jwtService: JwtService
  ) {}

  async execute(userData: CreateUserRequest): Promise<AuthResponse> {
    const { email, password, role = UserRole.USER } = userData;

    if (!email || !password) {
      throw new ValidationError('Email y contraseña son requeridos');
    }

    if (password.length < 6) {
      throw new ValidationError('La contraseña debe tener al menos 6 caracteres');
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('El usuario ya existe');
    }

    const hashedPassword = await PasswordService.hash(password);
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      role
    });

    // Generar token automáticamente después del registro
    const token = this.jwtService.generateToken({ userId: user.id, email: user.email, role: user.role });
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword
    };
  }
}