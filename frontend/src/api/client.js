import axios from 'axios';

export const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:5105/api').replace(/\/api$/, '');

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5105/api',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('hh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.error?.message || 'Network error — is the backend running?';
    if (status === 401 && !err.config.url.includes('/auth/')) {
      localStorage.removeItem('hh_token');
      localStorage.removeItem('hh_user');
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(new Error(message));
  }
);

export default client;
