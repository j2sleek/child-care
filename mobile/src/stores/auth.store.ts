import { create } from 'zustand';
import { saveTokens, clearTokens, loadTokens } from '../lib/secureStorage';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  login: (token: string, refreshToken: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (token: string, refreshToken: string) => Promise<void>;
  setUser: (user: AuthUser) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  isHydrated: false,

  login: async (token, refreshToken, user) => {
    await saveTokens(token, refreshToken);
    set({ token, refreshToken, user });
  },

  logout: async () => {
    await clearTokens();
    set({ token: null, refreshToken: null, user: null });
  },

  setTokens: async (token, refreshToken) => {
    await saveTokens(token, refreshToken);
    set({ token, refreshToken });
  },

  setUser: (user) => set({ user }),

  hydrate: async () => {
    const { token, refreshToken } = await loadTokens();
    set({ token, refreshToken, isHydrated: true });
  },
}));
