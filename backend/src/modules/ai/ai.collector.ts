import { Types } from 'mongoose';
import ChildModel from '../children/child.model.ts';
import CareEventModel from '../events/careEvent.model.ts';
import NormModel from '../norms/norm.model.ts';
import { sleepSummaryPerDay, feedingPattern, wakeWindows } from '../analytics/analytics.service.ts';
import { env } from '../../config/env.ts';

export interface ChildContext {
  name: string;
  dateOfBirth: Date;
  ageWeeks: number;
  ageMonths: number;
}

export interface AiContext {
  child: ChildContext;
  recentEvents: {
    sleep: any[];
    feed: any[];
    diaper: any[];
    mood: any[];
  };
  analytics: {
    sleepSummary: any[];
    feedingPattern: any[];
    wakeWindows: any[];
  };
  norms: {
    sleepMinutesPerDay?: { low: number; high: number };
    feedsPerDay?: { low: number; high: number };
    wakeWindowMinutes?: { low: number; high: number };
  };
}

export async function collectChildContext(childId: string): Promise<ChildContext> {
  const child = await ChildModel.findById(childId).lean();
  if (!child) {
    throw Object.assign(new Error('Child not found'), { statusCode: 404, code: 'NOT_FOUND' });
  }
  const now = new Date();
  const ageMs = now.getTime() - new Date(child.dateOfBirth).getTime();
  const ageWeeks = Math.floor(ageMs / (7 * 24 * 60 * 60 * 1000));
  const ageMonths = Math.floor(ageMs / (30.44 * 24 * 60 * 60 * 1000));
  return {
    name: child.name,
    dateOfBirth: child.dateOfBirth,
    ageWeeks,
    ageMonths
  };
}

export async function collectRecentEvents(childId: string, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const events = await CareEventModel.find({
    childId: new Types.ObjectId(childId),
    startTime: { $gte: since }
  }).sort({ startTime: -1 }).limit(500).lean();

  return {
    sleep: events.filter(e => e.type === 'sleep'),
    feed: events.filter(e => e.type === 'feed'),
    diaper: events.filter(e => e.type === 'diaper'),
    mood: events.filter(e => e.type === 'mood')
  };
}

export async function collectAnalytics(userId: string, childId: string) {
  const [sleepSummary, feedingData, wakeWindowData] = await Promise.all([
    sleepSummaryPerDay(userId, childId),
    feedingPattern(userId, childId),
    wakeWindows(userId, childId)
  ]);
  return {
    sleepSummary,
    feedingPattern: feedingData,
    wakeWindows: wakeWindowData
  };
}

export async function collectNorms(ageWeeks: number) {
  const norms = await NormModel.find({
    version: env.NORMS_VERSION,
    ageWeeksMin: { $lte: ageWeeks },
    ageWeeksMax: { $gte: ageWeeks }
  }).lean();

  const result: AiContext['norms'] = {};
  for (const norm of norms) {
    result[norm.metric] = { low: norm.low, high: norm.high };
  }
  return result;
}

export async function buildAiContext(userId: string, childId: string): Promise<AiContext> {
  const child = await collectChildContext(childId);
  const [recentEvents, analytics, norms] = await Promise.all([
    collectRecentEvents(childId),
    collectAnalytics(userId, childId),
    collectNorms(child.ageWeeks)
  ]);
  return { child, recentEvents, analytics, norms };
}
