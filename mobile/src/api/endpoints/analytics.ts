import { apiClient } from '../client';

export interface DateRangeParams {
  from?: string;
  to?: string;
}

export interface SleepSummary {
  date: string;
  totalMinutes: number;
  sessions: number;
  avgDuration: number;
}

export interface FeedingPattern {
  date: string;
  count: number;
  totalVolumeMl?: number;
  avgIntervalMinutes?: number;
}

export interface WakeWindow {
  date: string;
  avgMinutes: number;
  count: number;
}

export const analyticsApi = {
  sleep: (childId: string, params?: DateRangeParams) =>
    apiClient
      .get<{ summary: SleepSummary[] }>(`/analytics/sleep/${childId}`, { params })
      .then((r) => r.data),

  feeding: (childId: string, params?: DateRangeParams) =>
    apiClient
      .get<{ patterns: FeedingPattern[] }>(`/analytics/feeding/${childId}`, { params })
      .then((r) => r.data),

  wakeWindows: (childId: string, params?: DateRangeParams) =>
    apiClient
      .get<{ windows: WakeWindow[] }>(`/analytics/wake-windows/${childId}`, { params })
      .then((r) => r.data),
};
