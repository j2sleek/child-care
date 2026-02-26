import mongoose, { Schema, Document, Model, Types } from 'mongoose';
export type CareEventType = 'sleep' | 'feed' | 'diaper' | 'mood';

export interface CareEventDoc extends Document {
  childId: Types.ObjectId;
  recordedBy: Types.ObjectId;
  type: CareEventType;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  data?: Record<string, any>;
  notes?: string;
  createdAt: Date; 
  updatedAt: Date;
}

const CareEventSchema = new Schema<CareEventDoc>({
    childId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Child', 
      index: true, 
      required: true 
    },
    recordedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    type: { 
      type: String, 
      enum: ['sleep','feed','diaper','mood'], 
      index: true, 
      required: true 
    },
    startTime: { 
      type: Date, 
      index: true, 
      required: true 
    },
    endTime: { type: Date },
    durationMinutes: { type: Number },
    data: { type: Schema.Types.Mixed },
    notes: { type: String }
  }, { timestamps: true }
);

CareEventSchema.index({ childId: 1, startTime: 1 });
// Supports analytics queries that filter by childId + type then sort by startTime
CareEventSchema.index({ childId: 1, type: 1, startTime: 1 });

const CareEventModel: Model<CareEventDoc> = mongoose.model<CareEventDoc>('CareEvent', CareEventSchema);
export default CareEventModel;
