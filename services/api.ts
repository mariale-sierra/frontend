import axios from 'axios';
import Constants from 'expo-constants';
import i18n from '../i18n';
import { getAccessToken } from './auth/token.service';
import { useErrorNotificationStore } from '../store/errorNotificationStore';

// Lets a specific call opt out of the global error toast below — for
// best-effort writes a caller already handles on its own (catches, logs, and
// deliberately continues rather than failing the whole flow), the shared
// interceptor firing a scary toast anyway is misleading, not helpful. See
// applyExerciseMetrics.ts's per-set metric writes for the motivating case.
declare module 'axios' {
  export interface AxiosRequestConfig {
    suppressErrorToast?: boolean;
  }
}

// Base URL comes from app config (`extra.apiUrl` in app.config.js), which itself reads the
// EXPO_PUBLIC_API_URL env var — falls back to the known dev IP if config resolution fails.
// NOTE: intentionally HTTP, not HTTPS. The backend has no TLS certificate yet; forcing HTTPS
// here would break every request. Switch the fallback once that infra work lands.
const FALLBACK_API_URL = 'http://20.63.84.1:3000';
const baseURL = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? FALLBACK_API_URL;

const api = axios.create({
  baseURL,
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Real day-boundary bug, not just unintuitive UX: every "is today done"
  // check (current day, streaks, today_completed) is computed backend-side
  // against a fixed UTC calendar day, with no idea what timezone the user
  // is actually in — so for anyone ahead of UTC, there's a real window
  // right after local midnight where a challenge still reads as "completed
  // today" from yesterday's photo, because the server's UTC day hasn't
  // rolled over yet. Sent fresh on every request (not cached/stored) so it
  // stays correct across DST changes and travel without any extra
  // client-side bookkeeping — the backend is expected to fall back to UTC
  // if this header is ever missing (older app builds, etc.), matching
  // today's existing behavior exactly.
  config.headers['X-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.config?.suppressErrorToast) {
      return Promise.reject(error);
    }

    const errorStore = useErrorNotificationStore.getState();

    // Handle different error types
    if (error?.response?.status === 401) {
      errorStore.show({
        title: i18n.t('common.errors.sessionExpiredTitle'),
        message: i18n.t('common.errors.sessionExpiredMessage'),
        duration: 5000,
      });
    } else if (error?.response?.status === 403) {
      errorStore.show({
        title: i18n.t('common.errors.forbiddenTitle'),
        message: i18n.t('common.errors.forbiddenMessage'),
        duration: 5000,
      });
    } else if (error?.response?.status === 404) {
      errorStore.show({
        title: i18n.t('common.errors.notFoundTitle'),
        message: i18n.t('common.errors.notFoundMessage'),
        duration: 5000,
      });
    } else if (error?.response?.status === 500) {
      errorStore.show({
        title: i18n.t('common.errors.serverErrorTitle'),
        message: i18n.t('common.errors.serverErrorMessage'),
        duration: 5000,
      });
    } else if (error?.message === 'Network Error') {
      errorStore.show({
        title: i18n.t('common.errors.networkErrorTitle'),
        message: i18n.t('common.errors.networkErrorMessage'),
        duration: 5000,
      });
    } else if (error?.response?.data?.message) {
      errorStore.show({
        message: error.response.data.message,
        duration: 5000,
      });
    } else {
      errorStore.show({
        title: i18n.t('common.errors.genericTitle'),
        message: i18n.t('common.errors.genericMessage'),
        duration: 5000,
      });
    }

    return Promise.reject(error);
  },
);

export default api;