import { Schema, model, Document, Types } from 'mongoose';
import type { PlanTier } from './plan.config.ts';

export interface SubscriptionDoc extends Document {
  userId: Types.ObjectId;
  plan: PlanTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd?: Date;
  provider?: string;
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  cancelAtPeriodEnd: boolean;
  // Trial (free-tier AI/voice access window)
  trialUsed: boolean;
  trialStartedAt?: Date;
  trialEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<SubscriptionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    plan: { type: String, enum: ['free', 'pro'], default: 'pro' },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing'],
      required: true,
    },
    currentPeriodEnd: { type: Date },
    provider: { type: String },
    providerSubscriptionId: { type: String, index: true, sparse: true },
    providerCustomerId: { type: String, index: true, sparse: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    trialUsed: { type: Boolean, default: false, index: true },
    trialStartedAt: { type: Date },
    trialEndsAt: { type: Date, index: true },
  },
  { timestamps: true },
);

export default model<SubscriptionDoc>('Subscription', subscriptionSchema);
