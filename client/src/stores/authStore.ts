import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAccessToken, clearAccessToken } from '../lib/api.js';

export interface AuthState {
  userId: string | null;
  isGuest: boolean;
  guestToken: string | null;
  isAuthenticated: boolean;
}

interface AuthStore extends AuthState {
  setAuth: (userId: string, isGuest: boolean, accessToken: string, guestToken?: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      userId: null,
      isGuest: true,
      guestToken: null,
      isAuthenticated: false,

      setAuth: (userId, isGuest, accessToken, guestToken) => {
        setAccessToken(accessToken);
        set({ userId, isGuest, guestToken: guestToken ?? null, isAuthenticated: true });
      },

      clearAuth: () => {
        clearAccessToken();
        set({ userId: null, isGuest: true, guestToken: null, isAuthenticated: false });
      },
    }),
    { name: 'wb-auth', partialize: (s) => ({ userId: s.userId, isGuest: s.isGuest, guestToken: s.guestToken }) }
  )
);
