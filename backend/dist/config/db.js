import mongoose from 'mongoose';
import { env } from "./env.js";
mongoose.set('strictQuery', true);
mongoose.set('autoIndex', env.NODE_ENV !== 'production');
export const dbReady = mongoose
    .connect(env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
export function isDbReady() {
    return mongoose.connection.readyState === 1;
}
export default mongoose;
