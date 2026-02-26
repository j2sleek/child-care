import { workerData, parentPort } from 'worker_threads';
import mongoose from 'mongoose';
import { env } from '../config/env.ts';
import redisClient from '../config/redis.ts';
import { generateDailyDigest } from '../modules/ai/ai.service.ts';

const { childId } = workerData as { childId: string };

async function run() {
  await Promise.all([
    mongoose.connect(env.MONGODB_URI),
    redisClient.isReady ? Promise.resolve() : redisClient.connect(),
  ]);
  try {
    await generateDailyDigest(childId);
    parentPort?.postMessage({ success: true, childId });
  } catch (err: any) {
    parentPort?.postMessage({ success: false, childId, error: err.message });
  } finally {
    await Promise.allSettled([
      mongoose.disconnect(),
      redisClient.quit(),
    ]);
  }
}

run().catch((err) => {
  parentPort?.postMessage({ success: false, childId, error: err.message });
});
