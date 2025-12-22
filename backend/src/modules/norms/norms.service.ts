import { createClient } from 'redis';
import { env } from '../../config/env.ts';
import NormModel, { type NormDoc } from './norm.model.ts';

const redis = createClient({ url: env.REDIS_URL });
redis.connect().catch(() => {});

export type NormRange = { low: number; high: number } | null;

export async function getNormRange(version: string, metric: 'sleepMinutesPerDay'|'feedsPerDay'|'wakeWindowMinutes', ageWeeks: number): Promise<NormRange> {
  const key = `norms:${version}:${metric}:${ageWeeks}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const doc = await NormModel.findOne({ version, metric, ageWeeksMin: { $lte: ageWeeks }, ageWeeksMax: { $gte: ageWeeks } }).lean();
  if (!doc) return null;

  const range = { low: doc.low, high: doc.high };
  await redis.set(key, JSON.stringify(range), { EX: env.CACHE_TTL_SECONDS });
  return range;
}
