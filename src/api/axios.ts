import axios from 'axios';

/** Base URL includes `/api` — ví dụ https://localhost:5000/api (API Gateway) */
const baseURL = import.meta.env.VITE_API_URL ?? 'https://api-gateway-lfnu.onrender.com/api';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const method = (config.method ?? 'get').toLowerCase();
    const hasBody = config.data !== undefined && config.data !== null;
    if (hasBody && typeof FormData !== 'undefined' && config.data instanceof FormData) {
      const h = config.headers;
      if (h && typeof (h as { delete?: (k: string) => void }).delete === 'function') {
        (h as { delete: (k: string) => void }).delete('Content-Type');
      } else {
        delete (config.headers as Record<string, unknown>)['Content-Type'];
      }
    } else if (hasBody && ['post', 'put', 'patch'].includes(method)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      const accessToken = localStorage.getItem('accessToken');
      if (refreshToken && accessToken) {
        try {
          const response = await axios.post(`${baseURL}/auth/refresh`, {
            accessToken,
            refreshToken,
          }, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const payload = response.data?.data ?? response.data;
          const newAccess = payload?.accessToken ?? payload?.AccessToken;
          const newRefresh = payload?.refreshToken ?? payload?.RefreshToken;
          if (newAccess && newRefresh) {
            localStorage.setItem('accessToken', newAccess);
            localStorage.setItem('refreshToken', newRefresh);
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return api(originalRequest);
          }
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
