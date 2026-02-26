import type { NotificationEvent } from '../notification.service.ts';

export const emailTemplates: Record<NotificationEvent, (p: { name?: string; trialEndsAt?: Date; daysRemaining?: number }) => { subject: string; text: string }> = {
  trial_started: ({ name, trialEndsAt }) => ({
    subject: 'Votre essai IA de 14 jours a commencé !',
    text: `Bonjour ${name ?? ''},\n\nVotre essai gratuit de 14 jours des fonctionnalités IA a commencé.\n\nFin de l'essai : ${trialEndsAt?.toDateString()}.\n\nL'équipe Child Care`,
  }),
  trial_expiring_soon: ({ name, daysRemaining, trialEndsAt }) => ({
    subject: `Votre essai IA expire dans ${daysRemaining} jour${(daysRemaining ?? 0) > 1 ? 's' : ''}`,
    text: `Bonjour ${name ?? ''},\n\nVotre essai IA expire dans ${daysRemaining} jour${(daysRemaining ?? 0) > 1 ? 's' : ''} (${trialEndsAt?.toDateString()}).\n\nPassez à Pro pour conserver l'accès.\n\nL'équipe Child Care`,
  }),
  trial_ended: ({ name }) => ({
    subject: 'Votre essai IA est terminé',
    text: `Bonjour ${name ?? ''},\n\nVotre essai IA de 14 jours est terminé. Passez à Pro pour retrouver l'accès.\n\nL'équipe Child Care`,
  }),
  care_event_logged: ({ name }) => ({
    subject: 'Nouvel événement de soin enregistré',
    text: `Bonjour ${name ?? ''},\n\nUn nouvel événement de soin a été enregistré pour votre enfant.\n\nL'équipe Child Care`,
  }),
};

export const pushTemplates: Record<NotificationEvent, (p: { trialEndsAt?: Date; daysRemaining?: number }) => { title: string; body: string }> = {
  trial_started: ({ trialEndsAt }) => ({
    title: 'Essai IA démarré !',
    body: `14 jours de fonctionnalités IA offertes. Fin le ${trialEndsAt?.toDateString()}.`,
  }),
  trial_expiring_soon: ({ daysRemaining }) => ({
    title: `Essai IA : encore ${daysRemaining} jour${(daysRemaining ?? 0) > 1 ? 's' : ''}`,
    body: 'Passez à Pro pour garder vos fonctionnalités IA.',
  }),
  trial_ended: () => ({
    title: 'Essai IA terminé',
    body: 'Passez à Pro pour retrouver les fonctionnalités IA.',
  }),
  care_event_logged: () => ({
    title: 'Nouvel événement',
    body: 'Un événement de soin a été enregistré pour votre enfant.',
  }),
};
