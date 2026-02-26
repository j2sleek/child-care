import ChildModel from '../children/child.model.ts';
import { isAiAvailable } from './providers/index.ts';
import { runWorker } from '../../workers/pool.ts';
import { env } from '../../config/env.ts';
import logger from '../../config/logger.ts';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour
const WORKER_TIMEOUT_MS = 120_000;

let lastRunDate: string | null = null;

async function runDigests() {
  if (!isAiAvailable()) {
    logger.debug('[ai-scheduler] AI provider not configured, skipping digest generation');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  if (lastRunDate === today) return; // Already ran today

  // Use UTC hours for deterministic scheduling regardless of server timezone
  const currentHour = new Date().getUTCHours();
  if (currentHour < env.DIGEST_SCHEDULE_HOUR) return; // Too early

  lastRunDate = today;
  logger.info('[ai-scheduler] Starting daily digest generation');

  // Process children in batches using cursor to avoid loading all IDs into memory
  const BATCH_SIZE = 100;
  let processed = 0;
  const cursor = ChildModel.find({}, { _id: 1 }).lean().cursor();

  const batch: string[] = [];

  const flushBatch = async () => {
    if (batch.length === 0) return;
    await Promise.allSettled(
      batch.map(async (childId) => {
        try {
          await runWorker('../workers/digest.worker.ts', { childId }, WORKER_TIMEOUT_MS);
          processed++;
        } catch (err: any) {
          logger.error({ childId, err: err.message }, '[ai-scheduler] Failed digest for child');
        }
      })
    );
    batch.length = 0;
  };

  for await (const child of cursor) {
    batch.push(child._id.toString());
    if (batch.length >= BATCH_SIZE) await flushBatch();
  }
  await flushBatch();

  logger.info({ processed }, '[ai-scheduler] Daily digest generation complete');
}

export function scheduleDigests() {
  // Check on startup (delayed 30s)
  setTimeout(() => {
    runDigests().catch(err => logger.error({ err }, '[ai-scheduler] Error'));
  }, 30_000);

  // Then check every hour for schedule
  setInterval(() => {
    runDigests().catch(err => logger.error({ err }, '[ai-scheduler] Error'));
  }, CHECK_INTERVAL_MS);
}
