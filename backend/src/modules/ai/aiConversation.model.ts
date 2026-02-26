import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AiConversationDoc extends Document {
  childId: Types.ObjectId;
  userId: Types.ObjectId;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<ConversationMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 8192 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const AiConversationSchema = new Schema<AiConversationDoc>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true },
);

// One conversation per (userId, childId) pair
AiConversationSchema.index({ userId: 1, childId: 1 }, { unique: true });

const AiConversationModel: Model<AiConversationDoc> = mongoose.model<AiConversationDoc>(
  'AiConversation',
  AiConversationSchema,
);
export default AiConversationModel;
