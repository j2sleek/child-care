import { Types } from 'mongoose';
import ChildModel from './child.model.ts';
import CareEventModel from '../events/careEvent.model.ts';
import GrowthMeasurementModel from './growth.model.ts';
import { requirePermission } from '../../utils/permissions.ts';
import { getAiProvider } from '../ai/providers/index.ts';
import logger from '../../config/logger.ts';

interface ReportRange {
  from?: string;
  to?: string;
}

function buildMatch(childId: string, type: string, range: ReportRange) {
  const match: any = { childId: new Types.ObjectId(childId), type };
  if (range.from || range.to) {
    match.startTime = {};
    if (range.from) match.startTime.$gte = new Date(range.from);
    if (range.to) match.startTime.$lte = new Date(range.to);
  }
  return match;
}

export async function generateReport(userId: string, childId: string, range: ReportRange) {
  await requirePermission(userId, childId, 'canRead');

  const child = await ChildModel.findById(childId).lean();
  if (!child) throw Object.assign(new Error('Child not found'), { statusCode: 404, code: 'NOT_FOUND' });

  const ageMs = Date.now() - child.dateOfBirth.getTime();
  const ageWeeks = Math.floor(ageMs / (7 * 24 * 60 * 60 * 1000));
  const ageMonths = Math.floor(ageMs / (30.44 * 24 * 60 * 60 * 1000));

  // Aggregate sleep
  const sleepData = await CareEventModel.aggregate([
    { $match: buildMatch(childId, 'sleep', range) },
    { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
        totalMinutes: { $sum: '$durationMinutes' },
        sessions: { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ]);

  // Aggregate feeding
  const feedData = await CareEventModel.aggregate([
    { $match: buildMatch(childId, 'feed', range) },
    { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
        totalAmountMl: { $sum: '$data.amountMl' },
        feedCount: { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ]);

  // Aggregate diaper
  const diaperData = await CareEventModel.aggregate([
    { $match: buildMatch(childId, 'diaper', range) },
    { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
        count: { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ]);

  // Aggregate mood
  const moodData = await CareEventModel.find(
    buildMatch(childId, 'mood', range),
    { startTime: 1, 'data.mood': 1, notes: 1 }
  ).sort({ startTime: 1 }).lean();

  // Growth measurements
  const growthFilter: any = { childId: new Types.ObjectId(childId) };
  if (range.from || range.to) {
    growthFilter.date = {};
    if (range.from) growthFilter.date.$gte = new Date(range.from);
    if (range.to) growthFilter.date.$lte = new Date(range.to);
  }
  const growthData = await GrowthMeasurementModel.find(growthFilter).sort({ date: 1 }).lean();

  // Compute summary stats
  const avgSleepMinutes = sleepData.length
    ? Math.round(sleepData.reduce((s, d) => s + d.totalMinutes, 0) / sleepData.length)
    : null;
  const avgFeedsPerDay = feedData.length
    ? Math.round((feedData.reduce((s, d) => s + d.feedCount, 0) / feedData.length) * 10) / 10
    : null;
  const latestGrowth = growthData[growthData.length - 1] ?? null;

  // AI narrative summary (best-effort, no error thrown if unavailable)
  let aiSummary: string | null = null;
  try {
    const provider = getAiProvider();
    const dataSnippet = `
Child: ${child.name}, Age: ${ageWeeks} weeks (${ageMonths} months)
Period: ${range.from ?? 'all time'} to ${range.to ?? 'now'}
Sleep: avg ${avgSleepMinutes ?? 'N/A'} min/day over ${sleepData.length} days
Feeds: avg ${avgFeedsPerDay ?? 'N/A'} feeds/day over ${feedData.length} days
Diapers: ${diaperData.reduce((s, d) => s + d.count, 0)} total
Growth (latest): weight ${latestGrowth?.weightKg ?? 'N/A'} kg, height ${latestGrowth?.heightCm ?? 'N/A'} cm
`.trim();
    aiSummary = await provider.generateCompletion(
      'You are a pediatric care assistant. Write a concise, professional 2-3 sentence summary of this child\'s care data for a pediatrician report. Use objective clinical language. Do not diagnose.',
      dataSnippet,
    );
  } catch (err) {
    logger.warn({ err }, '[report] AI summary unavailable');
  }

  return {
    generatedAt: new Date().toISOString(),
    child: {
      id: child._id,
      name: child.name,
      dateOfBirth: child.dateOfBirth,
      ageWeeks,
      ageMonths,
    },
    period: {
      from: range.from ?? null,
      to: range.to ?? null,
    },
    sleep: {
      dailySummary: sleepData,
      averageMinutesPerDay: avgSleepMinutes,
    },
    feeding: {
      dailySummary: feedData,
      averageFeedsPerDay: avgFeedsPerDay,
    },
    diaper: {
      dailySummary: diaperData,
      total: diaperData.reduce((s, d) => s + d.count, 0),
    },
    mood: moodData.map((e: any) => ({
      date: e.startTime,
      mood: e.data?.mood ?? null,
      notes: e.notes ?? null,
    })),
    growth: growthData.map((g: any) => ({
      date: g.date,
      weightKg: g.weightKg ?? null,
      heightCm: g.heightCm ?? null,
      headCircumferenceCm: g.headCircumferenceCm ?? null,
      notes: g.notes ?? null,
    })),
    aiSummary,
  };
}
