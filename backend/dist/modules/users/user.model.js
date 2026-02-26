import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
    email: {
        type: String,
        unique: true,
        index: true,
        required: true
    },
    passwordHash: {
        type: String,
        required: true,
        select: false
    },
    name: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        index: true
    }
}, { timestamps: true });
const UserModel = mongoose.model('User', UserSchema);
export default UserModel;
