import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // Zustand persist stores the signed-in session under this key.
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = JSON.parse(localStorage.getItem('pos-nam-session') || 'null');
      const token = saved?.state?.accessToken;
      if (typeof token === 'string' && token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore malformed local state; the API will require a fresh login.
    }
  }
  return config;
});

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  total?: number;
  data: T;
}
