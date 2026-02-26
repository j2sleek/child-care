import { createClient } from 'redis';
import { env } from "../../config/env.js";
import NormModel from "./norm.model.js";
const redis = createClient({ url: env.REDIS_URL });
redis.connect().catch(() => { });
export async function getNormRange(version, metric, ageWeeks) {
    const key = `norms:${version}:${metric}:${ageWeeks}`;
    const cached = await redis.get(key);
    if (cached)
        return JSON.parse(cached);
    const doc = await NormModel.findOne({ version, metric, ageWeeksMin: { $lte: ageWeeks }, ageWeeksMax: { $gte: ageWeeks } }).lean();
    if (!doc)
        return null;
    const range = { low: doc.low, high: doc.high };
    await redis.set(key, JSON.stringify(range), { EX: env.CACHE_TTL_SECONDS });
    return range;
}
