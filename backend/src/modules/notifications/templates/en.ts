import type { NotificationEvent } from '../notification.service.ts';

export const emailTemplates: Record<NotificationEvent, (p: { name?: string; trialEndsAt?: Date; daysRemaining?: number }) => { subject: string; text: string }> = {
  trial_started: ({ name, trialEndsAt }) => ({
    subject: 'Your 14-day AI trial has started!',
    text: `Hi ${name ?? 'there'},\n\nYour free 14-day trial of AI features has started.\n\nTrial ends: ${trialEndsAt?.toDateString()}.\n\nThe Child Care team`,
  }),
  trial_expiring_soon: ({ name, daysRemaining, trialEndsAt }) => ({
    subject: `Your AI trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
    text: `Hi ${name ?? 'there'},\n\nYour free AI trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} (${trialEndsAt?.toDateString()}).\n\nUpgrade to Pro to keep access.\n\nThe Child Care team`,
  }),
  trial_ended: ({ name }) => ({
    subject: 'Your AI trial has ended',
    text: `Hi ${name ?? 'there'},\n\nYour 14-day AI trial has ended. Upgrade to Pro to regain access.\n\nThe Child Care team`,
  }),
  care_event_logged: ({ name }) => ({
    subject: 'New care event logged',
    text: `Hi ${name ?? 'there'},\n\nA new care event has been logged for your child.\n\nThe Child Care team`,
  }),
};

export const pushTemplates: Record<NotificationEvent, (p: { trialEndsAt?: Date; daysRemaining?: number }) => { title: string; body: string }> = {
  trial_started: ({ trialEndsAt }) => ({
    title: 'AI trial started!',
    body: `You have 14 days of free AI features. Ends ${trialEndsAt?.toDateString()}.`,
  }),
  trial_expiring_soon: ({ daysRemaining }) => ({
    title: `AI trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
    body: 'Upgrade to Pro to keep your AI features.',
  }),
  trial_ended: () => ({
    title: 'Your AI trial has ended',
    body: 'Upgrade to Pro to restore AI features and voice input.',
  }),
  care_event_logged: () => ({
    title: 'New care event',
    body: 'A care event was logged for your child.',
  }),
};
