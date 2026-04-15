import axios from 'axios';
import type { AxiosError } from 'axios';

const BASE_URL = import.meta.env['VITE_API_URL'] ?? '';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function getAccessToken(): string | null {
  return sessionStorage.getItem('wb_access_token');
}

function setAccessToken(token: string) {
  sessionStorage.setItem('wb_access_token', token);
}

export function clearAccessToken() {
  sessionStorage.removeItem('wb_access_token');
}

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token: string) => {
          originalRequest.headers!['Authorization'] = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post<{ data: { accessToken: string } }>(
        `${BASE_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const newToken = data.data.accessToken;
      setAccessToken(newToken);
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];
      originalRequest.headers!['Authorization'] = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch {
      clearAccessToken();
      window.dispatchEvent(new CustomEvent('auth:expired'));
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export { setAccessToken, getAccessToken };
