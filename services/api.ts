import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import i18n from '../i18n';
import { getAccessToken } from './auth/token.service';
import { useErrorNotificationStore } from '../store/errorNotificationStore';
import { isContentRejectedError } from '../utils/contentModeration';
import { notifySessionExpired } from './auth/sessionEvents';
import { getApiErrorStatus, isNetworkError, knownApiMessageKey } from '../utils/apiError';

// Lets a specific call opt out of the global error toast below — for
// best-effort writes a caller already handles on its own (catches, logs, and
// deliberately continues rather than failing the whole flow), the shared
// interceptor firing a scary toast anyway is misleading, not helpful. See
// applyExerciseMetrics.ts's per-set metric writes for the motivating case.
declare module 'axios' {
  export interface AxiosRequestConfig {
    suppressErrorToast?: boolean;
    /** This endpoint answers 401 for something other than the session (e.g. a
     * wrong password re-check) — don't sign the user out on it. */
    skipSessionExpiredLogout?: boolean;
  }
}

// Base URL comes from app config (`extra.apiUrl` in app.config.js), which itself reads the
// EXPO_PUBLIC_API_URL env var and refuses to resolve a non-https URL for release builds (B3).
// The plain-HTTP fallback below is for development only: a release build never silently
// falls back to clear text (and its APK blocks cleartext traffic anyway).
const DEV_FALLBACK_API_URL = 'http://20.63.84.1:3000';
const baseURL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  (__DEV__ ? DEV_FALLBACK_API_URL : undefined);

// Without a timeout a request on a dead connection never settles, leaving its
// screen on a spinner for ever. Generous enough for the heaviest list reads.
const REQUEST_TIMEOUT_MS = 30000;

const api = axios.create({
  baseURL,
  timeout: REQUEST_TIMEOUT_MS,
  // ngrok's free tier interstitial warning page intercepts every request
  // (not just browser navigations) to a *.ngrok-free.* domain unless this
  // header is present — without it, API calls get back an HTML warning page
  // instead of JSON. Harmless to send against the real backend, which just
  // ignores unknown headers.
  headers: baseURL?.includes('ngrok-free')
    ? { 'ngrok-skip-browser-warning': 'true' }
    : undefined,
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Browsers send a CORS preflight for this custom header. The public API may
  // still be running a deployment from before X-Timezone was added to its
  // allow-list, so keep web login and requests compatible with that server.
  // Native clients are not subject to CORS and retain timezone-aware day
  // boundaries; the backend falls back to UTC when web omits this header.
  if (Platform.OS !== 'web') {
    config.headers['X-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return config;
});

/**
 * The app's one error toast for a failed request. The response interceptor
 * calls it for every request unless `suppressErrorToast` is set; a caller that
 * suppressed it and then decides the failure is real can call it itself.
 */
export function showApiErrorToast(error: any) {
  const errorStore = useErrorNotificationStore.getState();
  const status = getApiErrorStatus(error);
  const show = (titleKey: string, messageKey: string, duration = 5000) =>
    errorStore.show({
      title: i18n.t(`common.errors.${titleKey}`),
      message: i18n.t(`common.errors.${messageKey}`),
      duration,
    });

  if (isContentRejectedError(error)) {
    show('contentRejectedTitle', 'contentRejectedMessage');
  } else if (status === 401 && error?.config?.headers?.Authorization) {
    show('sessionExpiredTitle', 'sessionExpiredMessage');
  } else if (status === 401) {
    // No session sent (sign-in, a password re-check): the credentials were wrong.
    show('genericTitle', 'unauthorizedMessage');
  } else if (status === 403 && error?.response?.data?.code === 'ACCOUNT_SUSPENDED') {
    // A moderation penalty: say until when, instead of the generic "no permission".
    const until = new Date(error.response.data.suspendedUntil);
    errorStore.show({
      title: i18n.t('common.errors.suspendedTitle'),
      message: i18n.t('common.errors.suspendedMessage', {
        date: Number.isNaN(until.getTime()) ? '' : until.toLocaleString(),
      }),
      duration: 7000,
    });
  } else if (knownApiMessageKey(error)) {
    show('genericTitle', `known.${knownApiMessageKey(error)}`);
  } else if (status === 403) {
    show('forbiddenTitle', 'forbiddenMessage');
  } else if (status === 404) {
    show('notFoundTitle', 'notFoundMessage');
  } else if (status === 409) {
    show('conflictTitle', 'conflictMessage');
  } else if (status === 429) {
    show('tooManyRequestsTitle', 'tooManyRequestsMessage');
  } else if (status === 400 || status === 422) {
    show('badRequestTitle', 'badRequestMessage');
  } else if (status !== undefined && status >= 500) {
    show('serverErrorTitle', 'serverErrorMessage');
  } else if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    show('timeoutTitle', 'timeoutMessage');
  } else if (isNetworkError(error)) {
    show('networkErrorTitle', 'networkErrorMessage');
  } else {
    show('genericTitle', 'genericMessage');
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 on a request that carried a token means the session is gone
    // (expired, or the account was banned/deleted): sign out instead of
    // leaving every screen failing on its own. Requests without a token
    // (login/register) answer 401 for wrong credentials and are left alone.
    if (
      error?.response?.status === 401 &&
      error?.config?.headers?.Authorization &&
      !error?.config?.skipSessionExpiredLogout
    ) {
      notifySessionExpired();
    }

    if (!error?.config?.suppressErrorToast) {
      showApiErrorToast(error);
    }

    return Promise.reject(error);
  },
);

export default api;
