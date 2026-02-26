import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface AiDigestDoc extends Document {
  childId: Types.ObjectId;
  date: string;
  insights: string[];
  recommendations: string[];
  anomalies: string[];
  summary: string;
  sleepScore?: number;
  feedingScore?: number;
  overallScore?: number;
  rawResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AiDigestSchema = new Schema<AiDigestDoc>({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'Child',
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true
  },
  insights: [{ type: String }],
  recommendations: [{ type: String }],
  anomalies: [{ type: String }],
  summary: {
    type: String,
    required: true
  },
  sleepScore: { type: Number },
  feedingScore: { type: Number },
  overallScore: { type: Number },
  rawResponse: { type: String, maxlength: 32768 }
}, { timestamps: true });

AiDigestSchema.index({ childId: 1, date: 1 }, { unique: true });

const AiDigestModel: Model<AiDigestDoc> = mongoose.model<AiDigestDoc>('AiDigest', AiDigestSchema);
export default AiDigestModel;
