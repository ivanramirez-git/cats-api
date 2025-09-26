import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { LoginRequest, AuthResponse } from '../../../domain/entities/User';
import { PasswordService } from '../../services/PasswordService';
import { JwtService } from '../../../infrastructure/adapters/jwt/JwtService';

export class LoginUser {
  constructor(
    private userRepository: IUserRepository,
    private jwtService: JwtService
  ) {}

  async execute(loginData: LoginRequest): Promise<AuthResponse> {
    const { email, password } = loginData;

    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const isPasswordValid = await PasswordService.verify(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    const token = this.jwtService.generateToken({ userId: user.id, email: user.email, role: user.role });
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword
    };
  }
}