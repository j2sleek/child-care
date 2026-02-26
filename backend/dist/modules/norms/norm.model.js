import mongoose, { Schema } from 'mongoose';
const NormSchema = new Schema({
    version: {
        type: String,
        required: true,
        index: true
    },
    metric: {
        type: String,
        enum: ['sleepMinutesPerDay', 'feedsPerDay', 'wakeWindowMinutes'],
        required: true,
        index: true
    },
    ageWeeksMin: {
        type: Number,
        required: true
    },
    ageWeeksMax: {
        type: Number,
        required: true
    },
    low: {
        type: Number,
        required: true
    },
    high: {
        type: Number,
        required: true
    },
    notes: { type: String }
}, { timestamps: true });
NormSchema.index({
    version: 1,
    metric: 1,
    ageWeeksMin: 1,
    ageWeeksMax: 1
}, { unique: true });
export const NormModel = mongoose.model('Norm', NormSchema);
export default NormModel;
