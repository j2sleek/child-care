import mongoose, { Schema } from 'mongoose';
const ChildAccessSchema = new Schema({
    childId: {
        type: Schema.Types.ObjectId,
        ref: 'Child',
        index: true,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
        required: true
    },
    role: {
        type: String,
        enum: ['father', 'mother', 'nanny', 'doctor'],
        required: true
    },
    permissions: {
        canRead: { type: Boolean, default: true },
        canWrite: { type: Boolean, default: false },
        canInvite: { type: Boolean, default: false }
    }
}, { timestamps: true });
ChildAccessSchema.index({
    childId: 1,
    userId: 1
}, { unique: true });
const ChildAccessModel = mongoose.model('ChildAccess', ChildAccessSchema);
export default ChildAccessModel;
