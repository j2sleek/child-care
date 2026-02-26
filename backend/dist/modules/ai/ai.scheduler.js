import ChildModel from "../children/child.model.js";
import { isAiAvailable } from "./providers/index.js";
import { runWorker } from "../../workers/pool.js";
import { env } from "../../config/env.js";
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour
const WORKER_TIMEOUT_MS = 120_000;
let lastRunDate = null;
async function runDigests() {
    if (!isAiAvailable()) {
        console.log('[ai-scheduler] AI provider not configured, skipping digest generation');
        return;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (lastRunDate === today)
        return; // Already ran today
    const currentHour = new Date().getHours();
    if (currentHour < env.DIGEST_SCHEDULE_HOUR)
        return; // Too early
    lastRunDate = today;
    console.log('[ai-scheduler] Starting daily digest generation');
    const children = await ChildModel.find({}, { _id: 1 }).lean();
    for (const child of children) {
        try {
            await runWorker('../workers/digest.worker.ts', { childId: child._id.toString() }, WORKER_TIMEOUT_MS);
            console.log(`[ai-scheduler] Digest generated for child ${child._id}`);
        }
        catch (err) {
            console.error(`[ai-scheduler] Failed digest for child ${child._id}:`, err.message);
        }
    }
    console.log('[ai-scheduler] Daily digest generation complete');
}
export function scheduleDigests() {
    // Check on startup (delayed 30s)
    setTimeout(() => {
        runDigests().catch(err => console.error('[ai-scheduler] Error:', err));
    }, 30_000);
    // Then check every hour for schedule
    setInterval(() => {
        runDigests().catch(err => console.error('[ai-scheduler] Error:', err));
    }, CHECK_INTERVAL_MS);
}
