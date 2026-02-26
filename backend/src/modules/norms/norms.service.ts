import { Types } from 'mongoose';
import { env } from '../../config/env.ts';
import redisClient from '../../config/redis.ts';
import NormModel from './norm.model.ts';
import NormSuggestionModel from './normSuggestion.model.ts';
import { getAiProvider } from '../ai/providers/index.ts';
import { METRICS, AGE_BANDS, SYSTEM_PROMPT, buildUserPrompt, type NormMetric } from './normsPipeline.prompts.ts';

// ── Existing norm lookup (used by AI collector) ─────────────────────

export type NormRange = { low: number; high: number } | null;

export async function getNormRange(
  version: string,
  metric: 'sleepMinutesPerDay' | 'feedsPerDay' | 'wakeWindowMinutes',
  ageWeeks: number
): Promise<NormRange> {
  const key = `norms:${version}:${metric}:${ageWeeks}`;
  try {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);
  } catch { /* cache miss is fine */ }

  const doc = await NormModel.findOne({
    version,
    metric,
    ageWeeksMin: { $lte: ageWeeks },
    ageWeeksMax: { $gte: ageWeeks },
  }).lean();
  if (!doc) return null;

  const range = { low: doc.low, high: doc.high };
  try {
    await redisClient.set(key, JSON.stringify(range), { EX: env.CACHE_TTL_SECONDS });
  } catch { /* cache write failure is non-critical */ }
  return range;
}

// ── AI Research Pipeline ────────────────────────────────────────────

interface ResearchOptions {
  adminUserId: string;
  metric?: NormMetric;
  ageWeeksMin?: number;
  ageWeeksMax?: number;
  version?: string;
}

// Max concurrent AI calls — avoids hammering the API and causing gateway timeouts
const RESEARCH_CONCURRENCY = 5;

async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = [];
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  return results;
}

export async function researchNorms(opts: ResearchOptions) {
  const provider = getAiProvider();
  const version = opts.version ?? env.NORMS_VERSION;
  const metrics = opts.metric ? [opts.metric] : [...METRICS];
  const bands =
    opts.ageWeeksMin != null && opts.ageWeeksMax != null
      ? [{ min: opts.ageWeeksMin, max: opts.ageWeeksMax, label: `${opts.ageWeeksMin}-${opts.ageWeeksMax} weeks` }]
      : AGE_BANDS;

  const tasks: (() => Promise<any>)[] = [];
  for (const metric of metrics) {
    for (const band of bands) {
      tasks.push(async () => {
        const userPrompt = buildUserPrompt(metric, band);
        try {
          const raw = await provider.generateCompletion(SYSTEM_PROMPT, userPrompt);
          const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          const parsed = JSON.parse(cleaned);
          return NormSuggestionModel.create({
            version,
            metric,
            ageWeeksMin: band.min,
            ageWeeksMax: band.max,
            low: parsed.low,
            high: parsed.high,
            notes: parsed.notes || '',
            sources: (parsed.sources || []).slice(0, 20),
            confidence: parsed.confidence || 'medium',
            status: 'pending',
            requestedBy: new Types.ObjectId(opts.adminUserId),
          });
        } catch (err: any) {
          return { metric, ageWeeksMin: band.min, ageWeeksMax: band.max, error: err.message || 'Failed' };
        }
      });
    }
  }

  const results = await runWithConcurrency(tasks, RESEARCH_CONCURRENCY);

  return {
    version,
    generated: results.filter((r) => r._id).length,
    errors: results.filter((r) => r.error).length,
    results,
  };
}

// ── Suggestion CRUD ─────────────────────────────────────────────────

interface ListSuggestionsOptions {
  status?: string;
  metric?: string;
  page?: number;
  limit?: number;
}

export async function listSuggestions(opts: ListSuggestionsOptions) {
  const filter: any = {};
  if (opts.status) filter.status = opts.status;
  if (opts.metric) filter.metric = opts.metric;

  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    NormSuggestionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('requestedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .lean(),
    NormSuggestionModel.countDocuments(filter),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getSuggestion(id: string) {
  const doc = await NormSuggestionModel.findById(id)
    .populate('requestedBy', 'name email')
    .populate('reviewedBy', 'name email')
    .lean();
  if (!doc) {
    throw Object.assign(new Error('Suggestion not found'), { statusCode: 404, code: 'NOT_FOUND' });
  }
  return doc;
}

export async function approveSuggestion(id: string, adminUserId: string, reviewNotes?: string) {
  const suggestion = await NormSuggestionModel.findById(id);
  if (!suggestion) {
    throw Object.assign(new Error('Suggestion not found'), { statusCode: 404, code: 'NOT_FOUND' });
  }
  if (suggestion.status !== 'pending') {
    throw Object.assign(new Error(`Suggestion already ${suggestion.status}`), {
      statusCode: 400,
      code: 'INVALID_STATUS',
    });
  }

  const norm = await NormModel.findOneAndUpdate(
    {
      version: suggestion.version,
      metric: suggestion.metric,
      ageWeeksMin: suggestion.ageWeeksMin,
      ageWeeksMax: suggestion.ageWeeksMax,
    },
    {
      version: suggestion.version,
      metric: suggestion.metric,
      ageWeeksMin: suggestion.ageWeeksMin,
      ageWeeksMax: suggestion.ageWeeksMax,
      low: suggestion.low,
      high: suggestion.high,
      notes: suggestion.notes,
      source: 'ai-research',
      sourceDetails: `AI-generated. Sources: ${suggestion.sources.join(', ')}. Confidence: ${suggestion.confidence}`,
      approvedBy: new Types.ObjectId(adminUserId),
      approvedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  suggestion.status = 'approved';
  suggestion.reviewedBy = new Types.ObjectId(adminUserId);
  suggestion.reviewedAt = new Date();
  if (reviewNotes) suggestion.reviewNotes = reviewNotes;
  await suggestion.save();

  return { suggestion, norm };
}

export async function approveSuggestionBatch(ids: string[], adminUserId: string) {
  const settled = await Promise.allSettled(ids.map((id) => approveSuggestion(id, adminUserId)));
  const results = settled.map((s, i) =>
    s.status === 'fulfilled'
      ? { id: ids[i], status: 'approved' as const, norm: s.value.norm }
      : { id: ids[i], status: 'error' as const, error: (s.reason as Error).message }
  );
  return {
    approved: results.filter((r) => r.status === 'approved').length,
    errors: results.filter((r) => r.status === 'error').length,
    results,
  };
}

export async function rejectSuggestion(id: string, adminUserId: string, reviewNotes: string) {
  const suggestion = await NormSuggestionModel.findById(id);
  if (!suggestion) {
    throw Object.assign(new Error('Suggestion not found'), { statusCode: 404, code: 'NOT_FOUND' });
  }
  if (suggestion.status !== 'pending') {
    throw Object.assign(new Error(`Suggestion already ${suggestion.status}`), {
      statusCode: 400,
      code: 'INVALID_STATUS',
    });
  }

  suggestion.status = 'rejected';
  suggestion.reviewedBy = new Types.ObjectId(adminUserId);
  suggestion.reviewedAt = new Date();
  suggestion.reviewNotes = reviewNotes;
  await suggestion.save();

  return suggestion;
}

// ── Bulk Import ─────────────────────────────────────────────────────

interface BulkImportNorm {
  version: string;
  metric: 'sleepMinutesPerDay' | 'feedsPerDay' | 'wakeWindowMinutes';
  ageWeeksMin: number;
  ageWeeksMax: number;
  low: number;
  high: number;
  notes?: string;
}

export async function bulkImportNorms(norms: BulkImportNorm[], adminUserId: string) {
  const approvedBy = new Types.ObjectId(adminUserId);
  const approvedAt = new Date();
  const ops = norms.map((norm) => ({
    updateOne: {
      filter: {
        version: norm.version,
        metric: norm.metric,
        ageWeeksMin: norm.ageWeeksMin,
        ageWeeksMax: norm.ageWeeksMax,
      },
      update: { $set: { ...norm, source: 'manual', approvedBy, approvedAt } },
      upsert: true,
    },
  }));
  const writeResult = await NormModel.bulkWrite(ops, { ordered: false });
  return {
    imported: writeResult.upsertedCount + writeResult.modifiedCount,
    upserted: writeResult.upsertedCount,
    modified: writeResult.modifiedCount,
  };
}

// ── Coverage Analysis ───────────────────────────────────────────────

export async function analyzeCoverage(version?: string) {
  const ver = version ?? env.NORMS_VERSION;
  const norms = await NormModel.find({ version: ver }).lean();

  const coverage: any[] = [];
  for (const metric of METRICS) {
    for (const band of AGE_BANDS) {
      const existing = norms.find(
        (n) => n.metric === metric && n.ageWeeksMin === band.min && n.ageWeeksMax === band.max
      );
      coverage.push({
        metric,
        ageWeeksMin: band.min,
        ageWeeksMax: band.max,
        ageLabel: band.label,
        hasNorm: !!existing,
        norm: existing || null,
      });
    }
  }

  const total = METRICS.length * AGE_BANDS.length;
  const filled = coverage.filter((c) => c.hasNorm).length;

  return { version: ver, total, filled, gaps: total - filled, coverage };
}

export async function listVersions() {
  const agg = await NormModel.aggregate([
    { $group: { _id: '$version', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);
  return agg.map((r: any) => ({ version: r._id, count: r.count }));
}
