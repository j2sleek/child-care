import mongoose from 'mongoose'
import { env } from './env.ts'
import logger from './logger.ts'

mongoose.set('strictQuery', true)
mongoose.set('autoIndex', env.NODE_ENV !== 'production')

export const dbReady = mongoose
  .connect(env.MONGODB_URI)
  .then(() => logger.info('MongoDB connected'))
  .catch((err) => {
    logger.fatal({ err }, 'MongoDB connection error')
    process.exit(1)
  })

export function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export default mongoose
