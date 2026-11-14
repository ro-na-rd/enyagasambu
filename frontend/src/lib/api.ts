import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('nmo_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (!['get', 'head', 'options'].includes(config.method?.toLowerCase() || 'get')) {
      const csrfToken = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('nmo_csrf='))
        ?.split('=')[1];
      if (csrfToken) config.headers['X-CSRF-Token'] = decodeURIComponent(csrfToken);
    }
  }
  return config;
});

export default api;
