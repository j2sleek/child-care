import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth.store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — inject Bearer token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

// Response interceptor — handle 401 + token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Skip refresh for auth endpoints themselves
    if (original.url?.includes('/auth/')) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(original));
        });
      });
    }

    isRefreshing = true;
    const { refreshToken, logout, setTokens } = useAuthStore.getState();

    try {
      const res = await axios.post(`${BASE_URL}/v1/auth/refresh`, {
        refreshToken,
      });
      const { token: newToken, refreshToken: newRefresh } = res.data;
      setTokens(newToken, newRefresh);
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];
      original.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(original);
    } catch {
      logout();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);
