import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User, CreateUserRequest } from '../../../domain/entities/User';
import { UserModel, UserDocument } from '../orm-models/UserSchema';

export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email }).lean();
    if (!user) return null;
    
    return {
      id: user._id.toString(),
      email: user.email,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async create(userData: CreateUserRequest): Promise<User> {
    const user = new UserModel(userData);
    const savedUser = await user.save();
    
    return {
      id: savedUser._id.toString(),
      email: savedUser.email,
      password: savedUser.password,
      role: savedUser.role,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt
    };
  }

  async findById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id).lean();
    if (!user) return null;
    
    return {
      id: user._id.toString(),
      email: user.email,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}