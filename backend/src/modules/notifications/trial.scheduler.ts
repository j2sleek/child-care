import { Types } from 'mongoose';
import SubscriptionModel from '../billing/subscription.model.ts';
import UserModel from '../users/user.model.ts';
import { sendNotification } from './notification.service.ts';
import { invalidatePlanCache } from '../billing/subscription.service.ts';
import logger from '../../config/logger.ts';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly
const EXPIRY_WARNING_DAYS = 3;

let lastRunDate: string | null = null;

async function runTrialNotifications() {
  const today = new Date().toISOString().slice(0, 10);
  if (lastRunDate === today) return;
  lastRunDate = today;

  const now = new Date();

  // ── 1. Trials expiring in EXPIRY_WARNING_DAYS days ──────────────────
  const warningFrom = new Date(now);
  const warningTo = new Date(now);
  warningTo.setDate(warningTo.getDate() + EXPIRY_WARNING_DAYS);
  // Only same calendar day as the threshold to avoid duplicate sends
  warningTo.setHours(23, 59, 59, 999);
  warningFrom.setDate(warningFrom.getDate() + EXPIRY_WARNING_DAYS);
  warningFrom.setHours(0, 0, 0, 0);

  const expiringSoon = await SubscriptionModel.find({
    trialUsed: true,
    trialEndsAt: { $gte: warningFrom, $lte: warningTo },
  }).lean();

  for (const sub of expiringSoon) {
    const user = await UserModel.findById(sub.userId, 'email name fcmToken').lean();
    if (!user) continue;
    const daysRemaining = Math.ceil(
      (sub.trialEndsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    await sendNotification('trial_expiring_soon', {
      to: user.email,
      fcmToken: (user as any).fcmToken,
      name: user.name,
      trialEndsAt: sub.trialEndsAt,
      daysRemaining,
    });
    logger.info({ userId: sub.userId }, '[trial-scheduler] Expiry warning sent');
  }

  // ── 2. Trials that expired since last run ────────────────────────────
  // Find trials where trialEndsAt is within the past 25 hours (covers daily run drift)
  const expiredFrom = new Date(now.getTime() - 25 * 60 * 60 * 1000);

  const justExpired = await SubscriptionModel.find({
    trialUsed: true,
    trialEndsAt: { $gte: expiredFrom, $lte: now },
  }).lean();

  for (const sub of justExpired) {
    const user = await UserModel.findById(sub.userId, 'email name fcmToken').lean();
    if (!user) continue;
    await sendNotification('trial_ended', {
      to: user.email,
      fcmToken: (user as any).fcmToken,
      name: user.name,
    });
    // Invalidate plan cache so the next request sees the expired trial immediately
    await invalidatePlanCache(sub.userId.toString());
    logger.info({ userId: sub.userId }, '[trial-scheduler] Trial ended notification sent');
  }

  logger.debug(
    { expiringSoon: expiringSoon.length, justExpired: justExpired.length },
    '[trial-scheduler] Run complete',
  );
}

export function scheduleTrialNotifications() {
  // Delay first run 60s after server start to let DB connect
  setTimeout(() => {
    runTrialNotifications().catch(err =>
      logger.error({ err }, '[trial-scheduler] Error on startup run'),
    );
  }, 60_000);

  setInterval(() => {
    runTrialNotifications().catch(err =>
      logger.error({ err }, '[trial-scheduler] Error'),
    );
  }, CHECK_INTERVAL_MS);
}
