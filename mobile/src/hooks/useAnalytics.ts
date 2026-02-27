import { useQuery } from '@tanstack/react-query';
import { analyticsApi, DateRangeParams } from '../api/endpoints/analytics';

export function useSleepAnalytics(childId: string, params?: DateRangeParams) {
  return useQuery({
    queryKey: ['analytics', childId, 'sleep', params],
    queryFn: () => analyticsApi.sleep(childId, params),
    staleTime: 30_000,
    retry: 1,
    enabled: !!childId,
  });
}

export function useFeedingAnalytics(childId: string, params?: DateRangeParams) {
  return useQuery({
    queryKey: ['analytics', childId, 'feeding', params],
    queryFn: () => analyticsApi.feeding(childId, params),
    staleTime: 30_000,
    retry: 1,
    enabled: !!childId,
  });
}

export function useWakeWindowAnalytics(childId: string, params?: DateRangeParams) {
  return useQuery({
    queryKey: ['analytics', childId, 'wake-windows', params],
    queryFn: () => analyticsApi.wakeWindows(childId, params),
    staleTime: 30_000,
    retry: 1,
    enabled: !!childId,
  });
}
