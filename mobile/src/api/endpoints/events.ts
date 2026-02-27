import { apiClient } from '../client';

export type EventType = 'sleep' | 'feed' | 'diaper' | 'mood';

export interface CareEvent {
  _id: string;
  childId: string;
  type: EventType;
  startTime: string;
  endTime?: string;
  notes?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateEventPayload {
  childId: string;
  type: EventType;
  startTime: string;
  endTime?: string;
  notes?: string;
  data?: Record<string, unknown>;
}

export interface EventsResponse {
  events: CareEvent[];
  total: number;
}

export const eventsApi = {
  list: (childId: string, params?: { limit?: number; offset?: number }) =>
    apiClient
      .get<EventsResponse>(`/events/timeline/${childId}`, { params })
      .then((r) => r.data),

  create: (data: CreateEventPayload) =>
    apiClient.post<CareEvent>('/events', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateEventPayload>) =>
    apiClient.patch<CareEvent>(`/events/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/events/${id}`).then((r) => r.data),
};
