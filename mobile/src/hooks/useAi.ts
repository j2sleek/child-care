import { useQuery, useMutation } from '@tanstack/react-query';
import { aiApi, ChatMessage } from '../api/endpoints/ai';

export function useAiInsights(childId: string) {
  return useQuery({
    queryKey: ['ai', childId, 'insights'],
    queryFn: () => aiApi.insights(childId),
    staleTime: 60_000,
    retry: 1,
    enabled: !!childId,
  });
}

export function useAiRecommendations(childId: string) {
  return useQuery({
    queryKey: ['ai', childId, 'recommendations'],
    queryFn: () => aiApi.recommendations(childId),
    staleTime: 60_000,
    retry: 1,
    enabled: !!childId,
  });
}

export function useAiAnomalies(childId: string) {
  return useQuery({
    queryKey: ['ai', childId, 'anomalies'],
    queryFn: () => aiApi.anomalies(childId),
    staleTime: 60_000,
    retry: 1,
    enabled: !!childId,
  });
}

export function useAiDigest(childId: string) {
  return useQuery({
    queryKey: ['ai', childId, 'digest'],
    queryFn: () => aiApi.digest(childId),
    staleTime: 300_000,
    retry: 1,
    enabled: !!childId,
  });
}

export function useAiChat(childId: string) {
  return useMutation({
    mutationFn: ({ message, history }: { message: string; history: ChatMessage[] }) =>
      aiApi.chat(childId, message, history),
  });
}
