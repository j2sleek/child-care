import type { NotificationEvent } from '../notification.service.ts';

export const emailTemplates: Record<NotificationEvent, (p: { name?: string; trialEndsAt?: Date; daysRemaining?: number }) => { subject: string; text: string }> = {
  trial_started: ({ name, trialEndsAt }) => ({
    subject: 'بدأت تجربتك المجانية للذكاء الاصطناعي لمدة 14 يومًا!',
    text: `مرحبًا ${name ?? ''},\n\nبدأت تجربتك المجانية لمدة 14 يومًا لميزات الذكاء الاصطناعي.\n\nتنتهي التجربة في: ${trialEndsAt?.toDateString()}.\n\nفريق Child Care`,
  }),
  trial_expiring_soon: ({ name, daysRemaining, trialEndsAt }) => ({
    subject: `تجربة الذكاء الاصطناعي تنتهي خلال ${daysRemaining} أيام`,
    text: `مرحبًا ${name ?? ''},\n\nتجربتك المجانية للذكاء الاصطناعي تنتهي خلال ${daysRemaining} أيام (${trialEndsAt?.toDateString()}).\n\nانتقل إلى Pro للاحتفاظ بالوصول.\n\nفريق Child Care`,
  }),
  trial_ended: ({ name }) => ({
    subject: 'انتهت تجربة الذكاء الاصطناعي',
    text: `مرحبًا ${name ?? ''},\n\nانتهت تجربتك المجانية للذكاء الاصطناعي. انتقل إلى Pro لاستعادة الوصول.\n\nفريق Child Care`,
  }),
  care_event_logged: ({ name }) => ({
    subject: 'تم تسجيل حدث رعاية جديد',
    text: `مرحبًا ${name ?? ''},\n\nتم تسجيل حدث رعاية جديد لطفلك.\n\nفريق Child Care`,
  }),
};

export const pushTemplates: Record<NotificationEvent, (p: { trialEndsAt?: Date; daysRemaining?: number }) => { title: string; body: string }> = {
  trial_started: ({ trialEndsAt }) => ({
    title: 'بدأت التجربة المجانية!',
    body: `14 يومًا من ميزات الذكاء الاصطناعي. تنتهي في ${trialEndsAt?.toDateString()}.`,
  }),
  trial_expiring_soon: ({ daysRemaining }) => ({
    title: `التجربة تنتهي خلال ${daysRemaining} أيام`,
    body: 'انتقل إلى Pro للحفاظ على ميزات الذكاء الاصطناعي.',
  }),
  trial_ended: () => ({
    title: 'انتهت تجربة الذكاء الاصطناعي',
    body: 'انتقل إلى Pro لاستعادة الميزات.',
  }),
  care_event_logged: () => ({
    title: 'حدث رعاية جديد',
    body: 'تم تسجيل حدث رعاية لطفلك.',
  }),
};
