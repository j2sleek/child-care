import redisClient, { isRedisReady } from '../../config/redis.ts';
import { isDbReady } from '../../config/db.ts';
import UserModel from '../users/user.model.ts';
import ChildModel from '../children/child.model.ts';
import CareEventModel from '../events/careEvent.model.ts';
import ChildAccessModel from '../access/childAccess.model.ts';
import NormModel from '../norms/norm.model.ts';
import NormSuggestionModel from '../norms/normSuggestion.model.ts';
import AiDigestModel from '../ai/aiDigest.model.ts';

async function getCachedOrCompute<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  try {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);
  } catch { /* cache miss */ }

  const result = await fn();

  try {
    await redisClient.set(key, JSON.stringify(result), { EX: ttlSeconds });
  } catch { /* cache write failure is non-critical */ }

  return result;
}

export async function getOverview() {
  return getCachedOrCompute('admin:metrics:overview', 60, async () => {
    const [users, children, events, access, norms, suggestions, digests] = await Promise.all([
      UserModel.countDocuments(),
      ChildModel.countDocuments(),
      CareEventModel.countDocuments(),
      ChildAccessModel.countDocuments(),
      NormModel.countDocuments(),
      NormSuggestionModel.countDocuments({ status: 'pending' }),
      AiDigestModel.countDocuments(),
    ]);
    return { users, children, events, access, norms, pendingSuggestions: suggestions, digests };
  });
}

type Granularity = 'day' | 'week' | 'month';

function dateGroupExpression(granularity: Granularity) {
  switch (granularity) {
    case 'day':
      return { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    case 'week':
      return { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
    case 'month':
      return { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  }
}

export async function getUserMetrics(from?: string, to?: string, granularity: Granularity = 'month') {
  return getCachedOrCompute(`admin:metrics:users:${from}:${to}:${granularity}`, 300, async () => {
    const dateFilter: any = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const match: any = {};
    if (from || to) match.createdAt = dateFilter;

    const [total, roleDistribution, signupTimeSeries, activeRecorders] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      UserModel.aggregate([
        ...(Object.keys(match).length ? [{ $match: match }] : []),
        { $group: { _id: dateGroupExpression(granularity), count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      CareEventModel.distinct('recordedBy'),
    ]);

    return {
      total,
      roleDistribution: Object.fromEntries(roleDistribution.map((r: any) => [r._id, r.count])),
      signupTimeSeries,
      activeUsersCount: activeRecorders.length,
    };
  });
}

export async function getChildMetrics() {
  return getCachedOrCompute('admin:metrics:children', 300, async () => {
    const [total, perUserDistribution, ageDistribution] = await Promise.all([
      ChildModel.countDocuments(),
      ChildModel.aggregate([
        { $group: { _id: '$createdBy', count: { $sum: 1 } } },
        { $group: { _id: '$count', users: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      ChildModel.aggregate([
        {
          $addFields: {
            ageWeeks: {
              $divide: [
                { $subtract: [new Date(), '$dateOfBirth'] },
                1000 * 60 * 60 * 24 * 7,
              ],
            },
          },
        },
        {
          $bucket: {
            groupBy: '$ageWeeks',
            boundaries: [0, 4, 13, 26, 52, 78, 104, 156],
            default: '156+',
            output: { count: { $sum: 1 } },
          },
        },
      ]),
    ]);

    return {
      total,
      childrenPerUser: perUserDistribution.map((d: any) => ({ childrenCount: d._id, users: d.users })),
      ageDistribution,
    };
  });
}

export async function getEventMetrics(from?: string, to?: string, granularity: Granularity = 'month') {
  return getCachedOrCompute(`admin:metrics:events:${from}:${to}:${granularity}`, 300, async () => {
    const dateFilter: any = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const match: any = {};
    if (from || to) match.startTime = dateFilter;

    const [total, byType, timeSeries, topRecorders] = await Promise.all([
      CareEventModel.countDocuments(),
      CareEventModel.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      CareEventModel.aggregate([
        ...(Object.keys(match).length ? [{ $match: match }] : []),
        {
          $group: {
            _id: {
              period: { $dateToString: { format: granularity === 'day' ? '%Y-%m-%d' : granularity === 'week' ? '%Y-W%V' : '%Y-%m', date: '$startTime' } },
              type: '$type',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.period': 1 } },
      ]),
      CareEventModel.aggregate([
        { $group: { _id: '$recordedBy', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            count: 1,
            'user.name': 1,
            'user.email': 1,
          },
        },
      ]),
    ]);

    return {
      total,
      byType: Object.fromEntries(byType.map((r: any) => [r._id, r.count])),
      timeSeries,
      topRecorders,
    };
  });
}

export async function getAccessMetrics() {
  return getCachedOrCompute('admin:metrics:access', 300, async () => {
    const [total, byRole, permissionDistribution] = await Promise.all([
      ChildAccessModel.countDocuments(),
      ChildAccessModel.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      ChildAccessModel.aggregate([
        {
          $group: {
            _id: {
              canRead: '$permissions.canRead',
              canWrite: '$permissions.canWrite',
              canInvite: '$permissions.canInvite',
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      total,
      byRole: Object.fromEntries(byRole.map((r: any) => [r._id, r.count])),
      permissionDistribution,
    };
  });
}

export async function getAiMetrics() {
  return getCachedOrCompute('admin:metrics:ai', 300, async () => {
    const [digestCount, avgScores] = await Promise.all([
      AiDigestModel.countDocuments(),
      AiDigestModel.aggregate([
        {
          $group: {
            _id: null,
            avgSleepScore: { $avg: '$sleepScore' },
            avgFeedingScore: { $avg: '$feedingScore' },
            avgOverallScore: { $avg: '$overallScore' },
          },
        },
      ]),
    ]);

    const scores = avgScores[0] ?? { avgSleepScore: null, avgFeedingScore: null, avgOverallScore: null };

    return {
      digestCount,
      avgSleepScore: scores.avgSleepScore,
      avgFeedingScore: scores.avgFeedingScore,
      avgOverallScore: scores.avgOverallScore,
    };
  });
}

export async function getSystemMetrics() {
  return getCachedOrCompute('admin:metrics:system', 30, async () => {
    const memUsage = process.memoryUsage();
    return {
      uptime: process.uptime(),
      nodeVersion: process.version,
      mongoConnected: isDbReady(),
      redisConnected: isRedisReady(),
      memory: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
      },
    };
  });
}
