import mongoose, { Schema, Document } from 'mongoose';
import { User, UserRole } from '../../../domain/entities/User';

export interface UserDocument extends Omit<User, 'id'>, Document {
  _id: string;
}

const userSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER
  }
}, {
  timestamps: true,
  toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
});

export const UserModel = mongoose.model<UserDocument>('User', userSchema);