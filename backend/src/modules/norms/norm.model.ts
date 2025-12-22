import mongoose, { Schema, Document, Model } from 'mongoose';

export interface NormDoc extends Document {
  version: string;
  metric: 'sleepMinutesPerDay' | 'feedsPerDay' | 'wakeWindowMinutes';
  ageWeeksMin: number; ageWeeksMax: number;
  low: number; high: number;
  notes?: string;
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
    notes: { type: String }
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
export type { NormDoc };
