import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface NormSuggestionDoc extends Document {
  version: string;
  metric: 'sleepMinutesPerDay' | 'feedsPerDay' | 'wakeWindowMinutes';
  ageWeeksMin: number;
  ageWeeksMax: number;
  low: number;
  high: number;
  notes: string;
  sources: string[];
  confidence: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: Types.ObjectId;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NormSuggestionSchema = new Schema<NormSuggestionDoc>({
  version: { type: String, required: true },
  metric: {
    type: String,
    enum: ['sleepMinutesPerDay', 'feedsPerDay', 'wakeWindowMinutes'],
    required: true
  },
  ageWeeksMin: { type: Number, required: true },
  ageWeeksMax: { type: Number, required: true },
  low: { type: Number, required: true },
  high: { type: Number, required: true },
  notes: { type: String, required: true },
  sources: [{ type: String, maxlength: 256 }],
  confidence: {
    type: String,
    enum: ['high', 'medium', 'low'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: { type: Date },
  reviewNotes: { type: String }
}, { timestamps: true });

NormSuggestionSchema.index({ status: 1, createdAt: -1 });
NormSuggestionSchema.index({ version: 1, metric: 1, ageWeeksMin: 1 });

const NormSuggestionModel: Model<NormSuggestionDoc> = mongoose.model<NormSuggestionDoc>('NormSuggestion', NormSuggestionSchema);
export default NormSuggestionModel;
