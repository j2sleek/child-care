import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface AuditLogDoc extends Document {
  userId?: Types.ObjectId;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, any>;
  ip?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<AuditLogDoc>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action:     { type: String, required: true, index: true },
    targetType: { type: String },
    targetId:   { type: String },
    meta:       { type: Schema.Types.Mixed },
    ip:         { type: String },
  },
  {
    // No updatedAt — append-only
    timestamps: { createdAt: true, updatedAt: false },
  },
);

AuditLogSchema.index({ createdAt: -1 });

const AuditLogModel: Model<AuditLogDoc> = mongoose.model<AuditLogDoc>('AuditLog', AuditLogSchema);
export default AuditLogModel;
