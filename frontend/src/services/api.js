import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const resolveApiBaseUrl = () => {
  const configuredUrl = process.env.REACT_APP_API_URL;

  if (!configuredUrl) {
    return '/api';
  }

  if (typeof window === 'undefined') {
    return configuredUrl;
  }

  const currentHost = window.location.hostname;
  const isLanAccess = !['localhost', '127.0.0.1'].includes(currentHost);
  const isLocalhostApi = /localhost|127\.0\.0\.1/i.test(configuredUrl);

  if (isLanAccess && isLocalhostApi) {
    return configuredUrl
      .replace(/localhost/gi, currentHost)
      .replace(/127\.0\.0\.1/gi, currentHost);
  }

  return configuredUrl;
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para lidar com erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
