import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface NormDoc extends Document {
  version: string;
  metric: 'sleepMinutesPerDay' | 'feedsPerDay' | 'wakeWindowMinutes';
  ageWeeksMin: number; ageWeeksMax: number;
  low: number; high: number;
  notes?: string;
  source?: 'manual' | 'ai-research';
  sourceDetails?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date; updatedAt: Date;
}

const NormSchema = new Schema<NormDoc>({
    version: { 
      type: String, 
      required: true, 
      index: true 
    },
    metric: { 
      type: String, 
      enum: ['sleepMinutesPerDay','feedsPerDay','wakeWindowMinutes'], 
      required: true, 
      index: true 
    },
    ageWeeksMin: { 
      type: Number, 
      required: true 
    },
    ageWeeksMax: { 
      type: Number, 
      required: true 
    },
    low: { 
      type: Number, 
      required: true 
    },
    high: { 
      type: Number, 
      required: true 
    },
    notes: { type: String },
    source: {
      type: String,
      enum: ['manual', 'ai-research'],
      default: 'manual'
    },
    sourceDetails: { type: String },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: { type: Date }
  }, { timestamps: true }
);

NormSchema.index({ 
  version: 1, 
  metric: 1, 
  ageWeeksMin: 1, 
  ageWeeksMax: 1 
}, { unique: true });

export const NormModel: Model<NormDoc> = mongoose.model<NormDoc>('Norm', NormSchema);
export default NormModel;
