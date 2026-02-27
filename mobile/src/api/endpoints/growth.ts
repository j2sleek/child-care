import { apiClient } from '../client';

export interface GrowthEntry {
  _id: string;
  childId: string;
  date: string;
  weightKg?: number;
  heightCm?: number;
  headCircumferenceCm?: number;
  notes?: string;
  createdAt: string;
}

export interface CreateGrowthPayload {
  date: string;
  weightKg?: number;
  heightCm?: number;
  headCircumferenceCm?: number;
  notes?: string;
}

export const growthApi = {
  list: (childId: string) =>
    apiClient.get<{ entries: GrowthEntry[] }>(`/children/${childId}/growth`).then((r) => r.data),

  create: (childId: string, data: CreateGrowthPayload) =>
    apiClient.post<GrowthEntry>(`/children/${childId}/growth`, data).then((r) => r.data),

  update: (childId: string, entryId: string, data: Partial<CreateGrowthPayload>) =>
    apiClient
      .patch<GrowthEntry>(`/children/${childId}/growth/${entryId}`, data)
      .then((r) => r.data),

  delete: (childId: string, entryId: string) =>
    apiClient.delete(`/children/${childId}/growth/${entryId}`).then((r) => r.data),
};
