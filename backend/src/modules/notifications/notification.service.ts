import { createTransport } from 'nodemailer';
import { env } from '../../config/env.ts';
import logger from '../../config/logger.ts';

// ── Types ────────────────────────────────────────────────────────────

export type NotificationEvent =
  | 'trial_started'
  | 'trial_expiring_soon'
  | 'trial_ended'
  | 'care_event_logged';

interface NotificationPayload {
  to: string;           // email address
  fcmToken?: string;    // device push token
  name?: string;        // user display name
  locale?: string;      // user preferred locale (default 'en')
  trialEndsAt?: Date;
  daysRemaining?: number;
}

// ── Email ────────────────────────────────────────────────────────────

function isEmailConfigured(): boolean {
  return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

function getTransport() {
  return createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

async function getTemplates(locale?: string) {
  const supported = ['en', 'fr', 'ar', 'es'];
  const lang = supported.includes(locale ?? '') ? locale! : 'en';
  const mod = await import(`./templates/${lang}.ts`);
  return { email: mod.emailTemplates, push: mod.pushTemplates };
}

async function buildEmailContent(event: NotificationEvent, payload: NotificationPayload) {
  const { email } = await getTemplates(payload.locale);
  return email[event]({ name: payload.name, trialEndsAt: payload.trialEndsAt, daysRemaining: payload.daysRemaining });
}

async function sendEmail(event: NotificationEvent, payload: NotificationPayload): Promise<void> {
  if (!isEmailConfigured()) return;
  const { subject, text } = await buildEmailContent(event, payload);
  try {
    await getTransport().sendMail({
      from: env.SMTP_FROM,
      to: payload.to,
      subject,
      text,
    });
    logger.info({ event, to: payload.to }, '[notifications] Email sent');
  } catch (err) {
    logger.error({ err, event, to: payload.to }, '[notifications] Email send failed');
  }
}

// ── Push (FCM) ───────────────────────────────────────────────────────

function isFcmConfigured(): boolean {
  return !!env.FCM_SERVER_KEY;
}

async function buildPushContent(event: NotificationEvent, payload: NotificationPayload) {
  const { push } = await getTemplates(payload.locale);
  return push[event]({ trialEndsAt: payload.trialEndsAt, daysRemaining: payload.daysRemaining });
}

async function sendPush(event: NotificationEvent, payload: NotificationPayload): Promise<void> {
  if (!isFcmConfigured() || !payload.fcmToken) return;
  const { title, body } = await buildPushContent(event, payload);
  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${env.FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: payload.fcmToken,
        notification: { title, body },
        data: { event },
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      logger.error({ event, status: response.status, body: text }, '[notifications] FCM push failed');
    } else {
      logger.info({ event }, '[notifications] Push sent');
    }
  } catch (err) {
    logger.error({ err, event }, '[notifications] FCM push error');
  }
}

// ── Public API ───────────────────────────────────────────────────────

export async function sendNotification(
  event: NotificationEvent,
  payload: NotificationPayload,
): Promise<void> {
  await Promise.allSettled([
    sendEmail(event, payload),
    sendPush(event, payload),
  ]);
}

/**
 * Notify all co-caregivers of a child when a new event is logged.
 * Looks up ChildAccess records + fcmTokens and fires push-only (no email for event updates).
 */
export async function notifyCoCaregiversOfEvent(params: {
  childId: string;
  recorderUserId: string;
  recorderName: string;
  childName: string;
  eventType: string;
}): Promise<void> {
  if (!isFcmConfigured()) return;

  // Lazy imports to avoid circular deps at module load time
  const { default: ChildAccessModel } = await import('../access/childAccess.model.ts');
  const { default: UserModel } = await import('../users/user.model.ts');
  const { Types } = await import('mongoose');

  const accessList = await ChildAccessModel.find({
    childId: new Types.ObjectId(params.childId),
    userId: { $ne: new Types.ObjectId(params.recorderUserId) },
    'permissions.canRead': true,
  }).lean();

  if (accessList.length === 0) return;

  const userIds = accessList.map((a) => a.userId);
  const users = await UserModel.find({ _id: { $in: userIds } }, 'fcmToken').lean();

  const title = `${params.recorderName} logged a ${params.eventType}`;
  const body = `New ${params.eventType} event for ${params.childName}`;

  await Promise.allSettled(
    users
      .filter((u: any) => u.fcmToken)
      .map((u: any) =>
        fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${env.FCM_SERVER_KEY}`,
          },
          body: JSON.stringify({
            to: u.fcmToken,
            notification: { title, body },
            data: { event: 'care_event_logged', childId: params.childId, eventType: params.eventType },
          }),
        }).catch(() => {}),
      ),
  );
}
