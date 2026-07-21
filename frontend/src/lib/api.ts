import axios from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, removeTokens } from './token';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          setAccessToken(data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        removeTokens();
        if (typeof window !== 'undefined') {
          const isAdmin = window.location.pathname.startsWith('/admin');
          window.location.href = isAdmin ? '/admin/login' : '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
