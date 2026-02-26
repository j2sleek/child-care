import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface GrowthMeasurementDoc extends Document {
  childId: Types.ObjectId;
  recordedBy: Types.ObjectId;
  date: Date;
  weightKg?: number;
  heightCm?: number;
  headCircumferenceCm?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GrowthMeasurementSchema = new Schema<GrowthMeasurementDoc>(
  {
    childId:    { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User',  required: true },
    date:       { type: Date, required: true, index: true },
    weightKg:            { type: Number, min: 0 },
    heightCm:            { type: Number, min: 0 },
    headCircumferenceCm: { type: Number, min: 0 },
    notes: { type: String },
  },
  { timestamps: true },
);

GrowthMeasurementSchema.index({ childId: 1, date: 1 });

const GrowthMeasurementModel: Model<GrowthMeasurementDoc> = mongoose.model<GrowthMeasurementDoc>(
  'GrowthMeasurement',
  GrowthMeasurementSchema,
);
export default GrowthMeasurementModel;
