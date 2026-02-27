import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../api/endpoints/billing';

export const BILLING_KEY = ['billing'] as const;

export function useBilling() {
  return useQuery({
    queryKey: BILLING_KEY,
    queryFn: billingApi.getPlan,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useStartTrial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: billingApi.startTrial,
    onSuccess: () => qc.invalidateQueries({ queryKey: BILLING_KEY }),
  });
}
