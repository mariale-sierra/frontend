import axios from 'axios';
import { getAccessToken } from './auth/token.service';

const api = axios.create({
  baseURL: 'http://20.63.84.1:3000',
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  console.log('[api] attaching Authorization:', Boolean(token));
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.log('[api] 401 received from:', error?.config?.url);
    }
    return Promise.reject(error);
  },
);

export default api;