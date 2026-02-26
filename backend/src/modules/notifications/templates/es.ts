import type { NotificationEvent } from '../notification.service.ts';

export const emailTemplates: Record<NotificationEvent, (p: { name?: string; trialEndsAt?: Date; daysRemaining?: number }) => { subject: string; text: string }> = {
  trial_started: ({ name, trialEndsAt }) => ({
    subject: '¡Tu prueba gratuita de IA de 14 días ha comenzado!',
    text: `Hola ${name ?? ''},\n\nTu prueba gratuita de 14 días de las funciones de IA ha comenzado.\n\nFinaliza el: ${trialEndsAt?.toDateString()}.\n\nEl equipo de Child Care`,
  }),
  trial_expiring_soon: ({ name, daysRemaining, trialEndsAt }) => ({
    subject: `Tu prueba de IA vence en ${daysRemaining} día${(daysRemaining ?? 0) !== 1 ? 's' : ''}`,
    text: `Hola ${name ?? ''},\n\nTu prueba gratuita de IA vence en ${daysRemaining} día${(daysRemaining ?? 0) !== 1 ? 's' : ''} (${trialEndsAt?.toDateString()}).\n\nActualiza a Pro para mantener el acceso.\n\nEl equipo de Child Care`,
  }),
  trial_ended: ({ name }) => ({
    subject: 'Tu prueba de IA ha finalizado',
    text: `Hola ${name ?? ''},\n\nTu prueba de IA de 14 días ha finalizado. Actualiza a Pro para recuperar el acceso.\n\nEl equipo de Child Care`,
  }),
  care_event_logged: ({ name }) => ({
    subject: 'Nuevo evento de cuidado registrado',
    text: `Hola ${name ?? ''},\n\nSe ha registrado un nuevo evento de cuidado para tu hijo/a.\n\nEl equipo de Child Care`,
  }),
};

export const pushTemplates: Record<NotificationEvent, (p: { trialEndsAt?: Date; daysRemaining?: number }) => { title: string; body: string }> = {
  trial_started: ({ trialEndsAt }) => ({
    title: '¡Prueba de IA iniciada!',
    body: `14 días de funciones de IA gratuitas. Finaliza el ${trialEndsAt?.toDateString()}.`,
  }),
  trial_expiring_soon: ({ daysRemaining }) => ({
    title: `Prueba de IA: quedan ${daysRemaining} día${(daysRemaining ?? 0) !== 1 ? 's' : ''}`,
    body: 'Actualiza a Pro para conservar tus funciones de IA.',
  }),
  trial_ended: () => ({
    title: 'Prueba de IA finalizada',
    body: 'Actualiza a Pro para restaurar las funciones de IA.',
  }),
  care_event_logged: () => ({
    title: 'Nuevo evento de cuidado',
    body: 'Se ha registrado un evento de cuidado para tu hijo/a.',
  }),
};
