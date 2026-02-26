import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { ChildRole } from './childAccess.model.ts';

export interface InviteLinkDoc extends Document {
  token: string;
  childId: Types.ObjectId;
  createdBy: Types.ObjectId;
  role: ChildRole;
  permissions: { canRead: boolean; canWrite: boolean; canInvite: boolean };
  expiresAt: Date;
  maxUses: number;
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const InviteLinkSchema = new Schema<InviteLinkDoc>(
  {
    token: { type: String, required: true, unique: true, index: true },
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['father', 'mother', 'nanny', 'doctor'], required: true },
    permissions: {
      canRead:   { type: Boolean, default: true },
      canWrite:  { type: Boolean, default: false },
      canInvite: { type: Boolean, default: false },
    },
    expiresAt: { type: Date, required: true, index: true },
    maxUses: { type: Number, default: 10 },
    useCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// TTL index — MongoDB auto-removes expired docs
InviteLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const InviteLinkModel: Model<InviteLinkDoc> = mongoose.model<InviteLinkDoc>('InviteLink', InviteLinkSchema);
export default InviteLinkModel;
