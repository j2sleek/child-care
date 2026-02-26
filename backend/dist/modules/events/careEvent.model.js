import mongoose, { Schema } from 'mongoose';
const CareEventSchema = new Schema({
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
        enum: ['sleep', 'feed', 'diaper', 'mood'],
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
}, { timestamps: true });
CareEventSchema.index({ childId: 1, startTime: 1 });
const CareEventModel = mongoose.model('CareEvent', CareEventSchema);
export default CareEventModel;
