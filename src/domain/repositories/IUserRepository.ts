import { User, CreateUserRequest } from '../entities/User';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(userData: CreateUserRequest): Promise<User>;
  findById(id: string): Promise<User | null>;
}