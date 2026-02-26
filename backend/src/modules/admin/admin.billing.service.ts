import { Types } from 'mongoose';
import SubscriptionModel from '../billing/subscription.model.ts';
import UserModel from '../users/user.model.ts';
import ChildModel from '../children/child.model.ts';
import CareEventModel from '../events/careEvent.model.ts';
import redisClient from '../../config/redis.ts';

interface PaginationOpts {
  page?: number;
  limit?: number;
}

function paginate(opts: PaginationOpts) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getCachedOrCompute<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  try {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);
  } catch { /* cache miss */ }

  const result = await fn();

  try {
    await redisClient.set(key, JSON.stringify(result), { EX: ttlSeconds });
  } catch { /* non-critical */ }

  return result;
}

// ── Subscriptions list ───────────────────────────────────────────────

interface ListSubscriptionsOpts extends PaginationOpts {
  plan?: string;
  status?: string;
  search?: string;   // search by email/name via join
}

export async function listSubscriptions(opts: ListSubscriptionsOpts) {
  const { page, limit, skip } = paginate(opts);
  const filter: any = {};

  if (opts.plan) filter.plan = opts.plan;
  if (opts.status) filter.status = opts.status;

  // If searching by user email/name, resolve userIds first
  if (opts.search) {
    const regex = new RegExp(opts.search, 'i');
    const users = await UserModel.find({ $or: [{ name: regex }, { email: regex }] }, '_id').lean();
    filter.userId = { $in: users.map((u) => u._id) };
  }

  const [subs, total] = await Promise.all([
    SubscriptionModel.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email role createdAt')
      .lean(),
    SubscriptionModel.countDocuments(filter),
  ]);

  // Count free users (those with NO subscription doc)
  const proUserCount = await SubscriptionModel.countDocuments({
    status: { $in: ['active', 'trialing', 'past_due'] },
  });
  const totalUsers = await UserModel.countDocuments();
  const freeUserCount = totalUsers - proUserCount;

  return {
    ...paginatedResponse(subs, total, page, limit),
    summary: { totalUsers, proUserCount, freeUserCount },
  };
}

// ── Single user subscription detail ────────────────────────────────

export async function getUserSubscriptionDetail(userId: string) {
  const user = await UserModel.findById(userId).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [sub, childCount, eventsThisMonth] = await Promise.all([
    SubscriptionModel.findOne({ userId: new Types.ObjectId(userId) }).lean(),
    ChildModel.countDocuments({ createdBy: new Types.ObjectId(userId) }),
    CareEventModel.countDocuments({
      recordedBy: new Types.ObjectId(userId),
      startTime: { $gte: startOfMonth },
    }),
  ]);

  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    subscription: sub ?? null,
    usage: {
      children: childCount,
      eventsThisMonth,
    },
  };
}

// ── Billing metrics ─────────────────────────────────────────────────

export async function getBillingMetrics() {
  return getCachedOrCompute('admin:metrics:billing', 120, async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalUsers,
      activeProCount,
      trialingCount,
      pastDueCount,
      canceledCount,
      newProThisMonth,
      newProLastMonth,
      canceledThisMonth,
      planDistribution,
      providerDistribution,
    ] = await Promise.all([
      UserModel.countDocuments(),
      SubscriptionModel.countDocuments({ status: 'active' }),
      SubscriptionModel.countDocuments({ status: 'trialing' }),
      SubscriptionModel.countDocuments({ status: 'past_due' }),
      SubscriptionModel.countDocuments({ status: 'canceled' }),
      SubscriptionModel.countDocuments({ status: 'active', updatedAt: { $gte: startOfMonth } }),
      SubscriptionModel.countDocuments({
        status: 'active',
        updatedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),
      SubscriptionModel.countDocuments({
        status: 'canceled',
        updatedAt: { $gte: startOfMonth },
      }),
      SubscriptionModel.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
      ]),
      SubscriptionModel.aggregate([
        { $match: { provider: { $exists: true, $ne: null } } },
        { $group: { _id: '$provider', count: { $sum: 1 } } },
      ]),
    ]);

    const freeUserCount = totalUsers - activeProCount - trialingCount - pastDueCount;

    return {
      totalUsers,
      freeUserCount: Math.max(0, freeUserCount),
      activeProCount,
      trialingCount,
      pastDueCount,
      canceledCount,
      conversionRate: totalUsers > 0
        ? Number(((activeProCount + trialingCount) / totalUsers * 100).toFixed(1))
        : 0,
      newProThisMonth,
      newProLastMonth,
      churnThisMonth: canceledThisMonth,
      planDistribution: Object.fromEntries(planDistribution.map((r: any) => [r._id, r.count])),
      providerDistribution: Object.fromEntries(providerDistribution.map((r: any) => [r._id, r.count])),
    };
  });
}
