import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi, CreateEventPayload } from '../api/endpoints/events';

export function useEvents(childId: string, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['events', childId, params],
    queryFn: () => eventsApi.list(childId, params),
    staleTime: 30_000,
    retry: 1,
    enabled: !!childId,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventPayload) => eventsApi.create(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['events', variables.childId] });
      qc.invalidateQueries({ queryKey: ['analytics', variables.childId] });
    },
  });
}

export function useDeleteEvent(childId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events', childId] });
      qc.invalidateQueries({ queryKey: ['analytics', childId] });
    },
  });
}
