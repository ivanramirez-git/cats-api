import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { CreateUserRequest, User, UserRole } from '../../../domain/entities/User';
import { PasswordService } from '../../services/PasswordService';

export class RegisterUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(userData: CreateUserRequest): Promise<Omit<User, 'password'>> {
    const { email, password, role = UserRole.USER } = userData;

    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('El usuario ya existe');
    }

    const hashedPassword = await PasswordService.hash(password);
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      role
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}