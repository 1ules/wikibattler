import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuthStore } from '../stores/authStore.js';
import type { ApiResponse } from '@wikibattler/shared';

export function useCreateGuest() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<{ accessToken: string; userId: string; guestToken: string }>>(
        '/auth/guest'
      );
      return data.data;
    },
    onSuccess: ({ accessToken, userId, guestToken }) => {
      setAuth(userId, true, accessToken, guestToken);
    },
  });
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data } = await api.post<ApiResponse<{ accessToken: string }>>('/auth/login', { email, password });
      return data.data;
    },
    onSuccess: ({ accessToken }) => {
      // Decode userId from JWT payload
      const payload = JSON.parse(atob(accessToken.split('.')[1]!));
      setAuth(payload.sub as string, false, accessToken);
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (body: { email: string; password: string; username: string }) => {
      const { data } = await api.post<ApiResponse<{ accessToken: string; userId: string }>>('/auth/register', body);
      return data.data;
    },
    onSuccess: ({ accessToken, userId }) => {
      setAuth(userId, false, accessToken);
    },
  });
}

export function useUpgradeGuest() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (body: { email: string; password: string; username: string }) => {
      const { data } = await api.post<ApiResponse<{ accessToken: string }>>('/auth/upgrade', body);
      return data.data;
    },
    onSuccess: ({ accessToken }) => {
      const payload = JSON.parse(atob(accessToken.split('.')[1]!));
      setAuth(payload.sub as string, false, accessToken);
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => clearAuth(),
  });
}
