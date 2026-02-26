import mongoose, { Schema } from 'mongoose';
const AiDigestSchema = new Schema({
    childId: {
        type: Schema.Types.ObjectId,
        ref: 'Child',
        required: true,
        index: true
    },
    date: {
        type: String,
        required: true
    },
    insights: [{ type: String }],
    recommendations: [{ type: String }],
    anomalies: [{ type: String }],
    summary: {
        type: String,
        required: true
    },
    sleepScore: { type: Number },
    feedingScore: { type: Number },
    overallScore: { type: Number },
    rawResponse: { type: String }
}, { timestamps: true });
AiDigestSchema.index({ childId: 1, date: 1 }, { unique: true });
const AiDigestModel = mongoose.model('AiDigest', AiDigestSchema);
export default AiDigestModel;
