import { workerData, parentPort } from 'worker_threads';
import mongoose from 'mongoose';
import { env } from "../config/env.js";
import { generateDailyDigest } from "../modules/ai/ai.service.js";
const { childId } = workerData;
async function run() {
    await mongoose.connect(env.MONGODB_URI);
    try {
        await generateDailyDigest(childId);
        parentPort?.postMessage({ success: true, childId });
    }
    catch (err) {
        parentPort?.postMessage({ success: false, childId, error: err.message });
    }
    finally {
        await mongoose.disconnect();
    }
}
run().catch((err) => {
    parentPort?.postMessage({ success: false, childId, error: err.message });
});
