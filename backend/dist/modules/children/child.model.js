import mongoose, { Schema } from 'mongoose';
const ChildSchema = new Schema({
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
}, { timestamps: true });
const ChildModel = mongoose.model('Child', ChildSchema);
export default ChildModel;
