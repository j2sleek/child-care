import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { childrenApi, CreateChildPayload } from '../api/endpoints/children';

export const CHILDREN_KEY = ['children'] as const;

export function useChildren() {
  return useQuery({
    queryKey: CHILDREN_KEY,
    queryFn: childrenApi.list,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useChild(id: string) {
  return useQuery({
    queryKey: ['children', id],
    queryFn: () => childrenApi.get(id),
    staleTime: 30_000,
    retry: 1,
    enabled: !!id,
  });
}

export function useCreateChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChildPayload) => childrenApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHILDREN_KEY }),
  });
}

export function useUpdateChild(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateChildPayload>) => childrenApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHILDREN_KEY });
      qc.invalidateQueries({ queryKey: ['children', id] });
    },
  });
}

export function useDeleteChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => childrenApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHILDREN_KEY }),
  });
}
