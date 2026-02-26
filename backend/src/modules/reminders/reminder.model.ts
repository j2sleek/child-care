import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ReminderType = 'interval' | 'time';

export interface ReminderDoc extends Document {
  userId: Types.ObjectId;
  childId?: Types.ObjectId;
  label: string;
  type: ReminderType;
  intervalHours?: number;  // for type='interval': fire if no event in last N hours
  timeOfDay?: string;       // for type='time': HH:MM UTC
  eventType?: string;       // optionally scoped to a specific CareEventType
  enabled: boolean;
  lastFiredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderSchema = new Schema<ReminderDoc>(
  {
    userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    childId:      { type: Schema.Types.ObjectId, ref: 'Child', index: true },
    label:        { type: String, required: true },
    type:         { type: String, enum: ['interval', 'time'], required: true },
    intervalHours:{ type: Number, min: 1 },
    timeOfDay:    { type: String, match: /^\d{2}:\d{2}$/ },
    eventType:    { type: String },
    enabled:      { type: Boolean, default: true, index: true },
    lastFiredAt:  { type: Date },
  },
  { timestamps: true },
);

const ReminderModel: Model<ReminderDoc> = mongoose.model<ReminderDoc>('Reminder', ReminderSchema);
export default ReminderModel;
