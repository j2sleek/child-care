import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { growthApi, CreateGrowthPayload } from '../api/endpoints/growth';

export function useGrowth(childId: string) {
  return useQuery({
    queryKey: ['growth', childId],
    queryFn: () => growthApi.list(childId),
    staleTime: 30_000,
    retry: 1,
    enabled: !!childId,
  });
}

export function useCreateGrowthEntry(childId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGrowthPayload) => growthApi.create(childId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['growth', childId] }),
  });
}

export function useDeleteGrowthEntry(childId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => growthApi.delete(childId, entryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['growth', childId] }),
  });
}
