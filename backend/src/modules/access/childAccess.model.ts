import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ChildRole = 'father' | 'mother' | 'nanny' | 'doctor';

export interface ChildAccessDoc extends Document {
  childId: Types.ObjectId;
  userId: Types.ObjectId;
  role: ChildRole;
  permissions: { 
    canRead: boolean; 
    canWrite: boolean; 
    canInvite: boolean 
  };
  createdAt: Date; 
  updatedAt: Date;
}

const ChildAccessSchema = new Schema<ChildAccessDoc>({
    childId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Child', 
      index: true, 
      required: true 
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      index: true, 
      required: true 
    },
    role: { 
      type: String, 
      enum: ['father', 'mother', 'nanny', 'doctor'], 
      required: true 
    },
    permissions: {
      canRead: { type: Boolean, default: true },
      canWrite: { type: Boolean, default: false },
      canInvite: { type: Boolean, default: false }
    }
  }, { timestamps: true }
);

ChildAccessSchema.index({ 
  childId: 1, 
  userId: 1 },
  { unique: true });

const ChildAccessModel: Model<ChildAccessDoc> = mongoose.model<ChildAccessDoc>('ChildAccess', ChildAccessSchema);
export default ChildAccessModel;
