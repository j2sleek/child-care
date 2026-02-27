import { apiClient } from '../client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; role: string };
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient
      .post<{ token: string; refreshToken: string }>('/auth/refresh', { refreshToken })
      .then((r) => r.data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/auth/change-password', data).then((r) => r.data),

  requestReset: (email: string) =>
    apiClient.post('/auth/request-reset', { email }).then((r) => r.data),

  resetPassword: (data: { token: string; newPassword: string }) =>
    apiClient.post('/auth/reset-password', data).then((r) => r.data),
};
