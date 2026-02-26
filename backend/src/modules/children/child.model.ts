import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ChildDoc extends Document {
  name: string;
  dateOfBirth: Date;
  createdBy: Types.ObjectId;
  avatarUrl?: string;
  avatarKey?: string; // S3 object key for deletion
  createdAt: Date;
  updatedAt: Date;
}

const ChildSchema = new Schema<ChildDoc>({
    name: {
      type: String,
      required: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    avatarUrl: { type: String },
    avatarKey: { type: String },
  },
  { timestamps: true }
);

const ChildModel: Model<ChildDoc> = mongoose.model<ChildDoc>('Child', ChildSchema);
export default ChildModel;
