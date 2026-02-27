import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remindersApi, CreateReminderPayload } from '../api/endpoints/reminders';

export const REMINDERS_KEY = ['reminders'] as const;

export function useReminders() {
  return useQuery({
    queryKey: REMINDERS_KEY,
    queryFn: remindersApi.list,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReminderPayload) => remindersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: REMINDERS_KEY }),
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateReminderPayload & { active: boolean }> }) =>
      remindersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: REMINDERS_KEY }),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remindersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: REMINDERS_KEY }),
  });
}
