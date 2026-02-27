import { apiClient } from '../client';

export interface Child {
  _id: string;
  name: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  avatarUrl?: string;
  createdAt: string;
}

export interface CreateChildPayload {
  name: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
}

export const childrenApi = {
  list: () => apiClient.get<Child[]>('/children/mine').then((r) => r.data),

  get: (id: string) => apiClient.get<Child>(`/children/${id}`).then((r) => r.data),

  create: (data: CreateChildPayload) =>
    apiClient.post<Child>('/children', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateChildPayload>) =>
    apiClient.patch<Child>(`/children/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/children/${id}`).then((r) => r.data),

  getAvatarUploadUrl: (id: string, mimeType: string) =>
    apiClient
      .post<{ uploadUrl: string; key: string }>(`/children/${id}/avatar/upload-url`, { mimeType })
      .then((r) => r.data),

  confirmAvatar: (id: string, key: string) =>
    apiClient.patch<Child>(`/children/${id}/avatar/confirm`, { key }).then((r) => r.data),

  getReport: (id: string) =>
    apiClient.get<{ html: string }>(`/children/${id}/report`).then((r) => r.data),
};
