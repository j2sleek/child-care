import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ChildDoc extends Document {
  name: string;
  dateOfBirth: Date;
  createdBy: Types.ObjectId;
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
    }
  },
  { timestamps: true }
);

const ChildModel: Model<ChildDoc> = mongoose.model<ChildDoc>('Child', ChildSchema);
export default ChildModel;
export type { ChildDoc };
