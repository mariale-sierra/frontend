import axios from 'axios';
import { getAccessToken } from './auth/token.service';
import { useErrorNotificationStore } from '../store/errorNotificationStore';

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
    const errorStore = useErrorNotificationStore.getState();
    
    // Handle different error types
    if (error?.response?.status === 401) {
      console.log('[api] 401 received from:', error?.config?.url);
      errorStore.show({
        title: 'Sesión expirada',
        message: 'Tu sesión ha expirado. Por favor inicia sesión de nuevo.',
        duration: 5000,
      });
    } else if (error?.response?.status === 403) {
      errorStore.show({
        title: 'Acceso denegado',
        message: 'No tienes permiso para realizar esta acción.',
        duration: 5000,
      });
    } else if (error?.response?.status === 404) {
      errorStore.show({
        title: 'No encontrado',
        message: 'El recurso que buscas no existe.',
        duration: 5000,
      });
    } else if (error?.response?.status === 500) {
      errorStore.show({
        title: 'Error del servidor',
        message: 'Ha ocurrido un error en el servidor. Intenta nuevamente.',
        duration: 5000,
      });
    } else if (error?.message === 'Network Error') {
      errorStore.show({
        title: 'Error de conexión',
        message: 'No se puede conectar al servidor. Verifica tu conexión a internet.',
        duration: 5000,
      });
    } else if (error?.response?.data?.message) {
      errorStore.show({
        message: error.response.data.message,
        duration: 5000,
      });
    } else {
      errorStore.show({
        title: 'Error',
        message: 'Ha ocurrido un error desconocido. Intenta nuevamente.',
        duration: 5000,
      });
    }

    return Promise.reject(error);
  },
);

export default api;