import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { CareEventType } from './careEvent.model.ts';

export interface EventTemplateDoc extends Document {
  userId: Types.ObjectId;
  name: string;
  type: CareEventType;
  durationMinutes?: number;
  data?: Record<string, any>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventTemplateSchema = new Schema<EventTemplateDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['sleep', 'feed', 'diaper', 'mood'], required: true },
    durationMinutes: { type: Number },
    data: { type: Schema.Types.Mixed },
    notes: { type: String },
  },
  { timestamps: true },
);

const EventTemplateModel: Model<EventTemplateDoc> = mongoose.model<EventTemplateDoc>(
  'EventTemplate',
  EventTemplateSchema,
);
export default EventTemplateModel;
