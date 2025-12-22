import mongoose, { Schema, Document, Model } from 'mongoose';

export interface UserDoc extends Document {
  email: string;
  passwordHash: string;
  name?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    email: { 
      type: String, 
      unique: true, 
      index: true, 
      required: true 
    },
    passwordHash: { 
      type: String, 
      required: true 
    },
    name: { 
      type: String 
    },
    role: { 
      type: String, 
      enum: ['user', 'admin'], 
      default: 'user', 
      index: true 
    }
  },
  { timestamps: true }
);

const UserModel: Model<UserDoc> = mongoose.model<UserDoc>('User', UserSchema);
export default UserModel;
