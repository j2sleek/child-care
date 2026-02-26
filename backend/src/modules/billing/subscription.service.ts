import { Types } from 'mongoose';
import SubscriptionModel from './subscription.model.ts';
import ChildModel from '../children/child.model.ts';
import CareEventModel from '../events/careEvent.model.ts';
import {
  PLAN_LIMITS,
  TRIAL_LIMIT_OVERRIDES,
  TRIAL_DURATION_DAYS,
  type PlanTier,
  type PlanLimits,
} from './plan.config.ts';
import redisClient from '../../config/redis.ts';
import UserModel from '../users/user.model.ts';
import { sendNotification } from '../notifications/notification.service.ts';
import { markOnboardingStep } from '../../utils/onboarding.ts';
import { logAudit } from '../../utils/audit.ts';

const PLAN_CACHE_TTL = 60; // seconds

export interface UserPlanInfo {
  plan: PlanTier;
  status: string;
  limits: PlanLimits;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  trial: {
    active: boolean;
    used: boolean;
    endsAt?: Date;
  };
}

export async function getUserPlan(userId: string): Promise<UserPlanInfo> {
  const cacheKey = `billing:plan:${userId}`;

  // Check Redis cache first
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as UserPlanInfo;
    }
  } catch {
    // Redis failure is non-fatal — fall through to DB lookup
  }

  const sub = await SubscriptionModel.findOne({ userId: new Types.ObjectId(userId) }).lean();

  let plan: PlanTier = 'free';
  let status = 'none';
  let currentPeriodEnd: Date | undefined;
  let cancelAtPeriodEnd = false;
  let trialActive = false;
  let trialUsed = false;
  let trialEndsAt: Date | undefined;

  if (sub) {
    status = sub.status;
    currentPeriodEnd = sub.currentPeriodEnd;
    cancelAtPeriodEnd = sub.cancelAtPeriodEnd;
    trialUsed = sub.trialUsed;
    trialEndsAt = sub.trialEndsAt;

    if (sub.status === 'active' || sub.status === 'past_due') {
      plan = 'pro';
    } else if (sub.status === 'trialing') {
      // Provider-managed trial — check it hasn't expired
      const now = new Date();
      if (sub.currentPeriodEnd && sub.currentPeriodEnd <= now) {
        plan = 'free'; // Expired
      } else {
        plan = 'pro';
      }
    } else if (sub.status === 'canceled') {
      const now = new Date();
      if (sub.currentPeriodEnd && sub.currentPeriodEnd > now) {
        plan = 'pro'; // Still within paid period
      } else {
        plan = 'free';
      }
    }
  }

  // Check free-tier trial (AI/voice only — does not upgrade plan to 'pro')
  if (plan === 'free' && sub?.trialUsed && sub.trialEndsAt) {
    const now = new Date();
    if (sub.trialEndsAt > now) {
      trialActive = true;
    }
  }

  // Build limits — start from base plan, overlay trial overrides if active
  let limits: PlanLimits = { ...PLAN_LIMITS[plan] };
  if (trialActive) {
    limits = { ...limits, ...TRIAL_LIMIT_OVERRIDES };
  }

  const result: UserPlanInfo = {
    plan,
    status,
    limits,
    ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
    cancelAtPeriodEnd,
    trial: {
      active: trialActive,
      used: trialUsed,
      ...(trialEndsAt ? { endsAt: trialEndsAt } : {}),
    },
  };

  // Cache result — use shorter TTL during active trial for faster expiry detection
  const ttl = trialActive && trialEndsAt
    ? Math.min(PLAN_CACHE_TTL, Math.ceil((trialEndsAt.getTime() - Date.now()) / 1000))
    : PLAN_CACHE_TTL;

  try {
    if (ttl > 0) await redisClient.setEx(cacheKey, ttl, JSON.stringify(result));
  } catch {
    // Non-fatal
  }

  return result;
}

export async function startTrial(userId: string): Promise<UserPlanInfo> {
  const existing = await SubscriptionModel.findOne({ userId: new Types.ObjectId(userId) }).lean();

  if (existing?.trialUsed) {
    throw Object.assign(
      new Error('Trial has already been used'),
      { statusCode: 409, code: 'TRIAL_ALREADY_USED' },
    );
  }

  // Don't grant trial if already on a paid plan
  if (existing && ['active', 'trialing', 'past_due'].includes(existing.status)) {
    throw Object.assign(
      new Error('Trial is not available for paid plan users'),
      { statusCode: 409, code: 'TRIAL_NOT_AVAILABLE' },
    );
  }

  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await SubscriptionModel.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    {
      $set: {
        trialUsed: true,
        trialStartedAt: now,
        trialEndsAt,
        // Ensure these have defaults if doc is being created
        plan: existing?.plan ?? 'free',
        status: existing?.status ?? 'none',
        cancelAtPeriodEnd: existing?.cancelAtPeriodEnd ?? false,
      },
    },
    { upsert: true, new: true },
  );

  await invalidatePlanCache(userId);
  markOnboardingStep(userId, 'startedTrial');
  const planInfo = await getUserPlan(userId);

  // Send trial_started notification (fire-and-forget)
  UserModel.findById(userId, 'email name fcmToken').lean().then((user) => {
    if (!user) return;
    sendNotification('trial_started', {
      to: user.email,
      fcmToken: (user as any).fcmToken,
      name: user.name,
      trialEndsAt,
    }).catch(() => {});
  }).catch(() => {});

  return planInfo;
}

export async function countChildrenForUser(userId: string): Promise<number> {
  return ChildModel.countDocuments({ createdBy: new Types.ObjectId(userId) });
}

export async function countEventsThisMonth(userId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return CareEventModel.countDocuments({
    recordedBy: new Types.ObjectId(userId),
    startTime: { $gte: startOfMonth },
  });
}

export async function invalidatePlanCache(userId: string): Promise<void> {
  try {
    await redisClient.del(`billing:plan:${userId}`);
  } catch {
    // Non-fatal
  }
}

type WebhookPayload = Record<string, any>;

export async function handleWebhook(
  provider: string,
  eventType: string,
  payload: WebhookPayload,
): Promise<{ handled: boolean }> {
  const providerCustomerId: string | undefined = payload.customer_id ?? payload.customerId;
  const providerSubscriptionId: string | undefined =
    payload.subscription_id ?? payload.subscriptionId ?? payload.id;
  const currentPeriodEnd: Date | undefined = payload.current_period_end
    ? new Date(
        typeof payload.current_period_end === 'number'
          ? payload.current_period_end * 1000
          : payload.current_period_end,
      )
    : undefined;

  const rawUserId: string | undefined = payload.userId ?? payload.user_id ?? payload.metadata?.userId;
  if (!rawUserId) {
    return { handled: false };
  }

  const activationEvents = new Set([
    'subscription_activated',
    'checkout.completed',
    'subscription_created',
  ]);
  const renewalEvents = new Set(['subscription_renewed', 'invoice.paid']);
  const cancellationEvents = new Set(['subscription_canceled']);
  const pastDueEvents = new Set([
    'subscription_past_due',
    'payment_failed',
    'invoice.payment_failed',
  ]);
  const trialEvents = new Set(['subscription_trial_started']);

  if (activationEvents.has(eventType)) {
    await SubscriptionModel.findOneAndUpdate(
      { userId: new Types.ObjectId(rawUserId) },
      {
        $set: {
          plan: 'pro',
          status: 'active',
          provider,
          ...(providerSubscriptionId ? { providerSubscriptionId } : {}),
          ...(providerCustomerId ? { providerCustomerId } : {}),
          ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
          cancelAtPeriodEnd: false,
        },
      },
      { upsert: true, new: true },
    );
    await invalidatePlanCache(rawUserId);
    return { handled: true };
  }

  if (renewalEvents.has(eventType)) {
    await SubscriptionModel.findOneAndUpdate(
      { userId: new Types.ObjectId(rawUserId) },
      {
        $set: {
          status: 'active',
          ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
          cancelAtPeriodEnd: false,
        },
      },
    );
    await invalidatePlanCache(rawUserId);
    return { handled: true };
  }

  if (cancellationEvents.has(eventType)) {
    const cancelAtEnd: boolean = payload.cancel_at_period_end ?? payload.cancelAtPeriodEnd ?? false;
    await SubscriptionModel.findOneAndUpdate(
      { userId: new Types.ObjectId(rawUserId) },
      {
        $set: {
          status: cancelAtEnd ? 'active' : 'canceled',
          cancelAtPeriodEnd: cancelAtEnd,
          ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
        },
      },
    );
    await invalidatePlanCache(rawUserId);
    return { handled: true };
  }

  if (pastDueEvents.has(eventType)) {
    await SubscriptionModel.findOneAndUpdate(
      { userId: new Types.ObjectId(rawUserId) },
      { $set: { status: 'past_due' } },
    );
    await invalidatePlanCache(rawUserId);
    return { handled: true };
  }

  if (trialEvents.has(eventType)) {
    await SubscriptionModel.findOneAndUpdate(
      { userId: new Types.ObjectId(rawUserId) },
      {
        $set: {
          plan: 'pro',
          status: 'trialing',
          provider,
          ...(providerSubscriptionId ? { providerSubscriptionId } : {}),
          ...(providerCustomerId ? { providerCustomerId } : {}),
          ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
        },
      },
      { upsert: true, new: true },
    );
    await invalidatePlanCache(rawUserId);
    return { handled: true };
  }

  return { handled: false };
}

export async function adminSetPlan(
  userId: string,
  plan: PlanTier,
  status: 'active' | 'canceled' | 'past_due' | 'trialing' = 'active',
  adminUserId?: string,
): Promise<void> {
  await SubscriptionModel.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    { $set: { plan, status, cancelAtPeriodEnd: false } },
    { upsert: true, new: true },
  );
  await invalidatePlanCache(userId);
  logAudit({ userId: adminUserId, action: 'admin.set_plan', targetType: 'User', targetId: userId, meta: { plan, status } });
}
