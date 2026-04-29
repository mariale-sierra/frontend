import axios from 'axios';
import { getAccessToken } from './auth/token.service';

const api = axios.create({
  baseURL: 'http://192.168.0.125:3000',
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;