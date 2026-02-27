import { apiClient } from '../client';

export interface Reminder {
  _id: string;
  childId?: string;
  title: string;
  body?: string;
  scheduledAt: string;
  repeat?: 'daily' | 'weekly' | 'none';
  active: boolean;
  createdAt: string;
}

export interface CreateReminderPayload {
  childId?: string;
  title: string;
  body?: string;
  scheduledAt: string;
  repeat?: 'daily' | 'weekly' | 'none';
}

export const remindersApi = {
  list: () => apiClient.get<{ reminders: Reminder[] }>('/reminders').then((r) => r.data),

  create: (data: CreateReminderPayload) =>
    apiClient.post<Reminder>('/reminders', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateReminderPayload & { active: boolean }>) =>
    apiClient.patch<Reminder>(`/reminders/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/reminders/${id}`).then((r) => r.data),
};
