import mongoose, { Schema, Document, Model } from 'mongoose';

export interface OnboardingChecklist {
  addedFirstChild: boolean;
  loggedFirstEvent: boolean;
  startedTrial: boolean;
  invitedCaregiver: boolean;
}

export interface UserDoc extends Document {
  email: string;
  passwordHash: string;
  name?: string;
  role: 'user' | 'admin';
  fcmToken?: string;
  locale: string;
  onboarding: OnboardingChecklist;
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
      required: true,
      select: false
    },
    name: {
      type: String
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true
    },
    fcmToken: {
      type: String,
      select: false,
    },
    locale: {
      type: String,
      default: 'en',
    },
    onboarding: {
      addedFirstChild:  { type: Boolean, default: false },
      loggedFirstEvent: { type: Boolean, default: false },
      startedTrial:     { type: Boolean, default: false },
      invitedCaregiver: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const UserModel: Model<UserDoc> = mongoose.model<UserDoc>('User', UserSchema);
export default UserModel;
