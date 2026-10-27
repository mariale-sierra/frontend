import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import i18n from '../i18n';
import { getAccessToken, getSessionEpoch } from './auth/token.service';
import { useErrorNotificationStore } from '../store/errorNotificationStore';
import { isContentRejectedError } from '../utils/contentModeration';
import { notifySessionExpired } from './auth/sessionEvents';
import { isSessionChangedError, refreshSession } from './auth/sessionRefresh';
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
    /** B4: a call that manages the session itself (POST /auth/login,
     * /auth/register, /auth/refresh, /auth/logout): sent without a bearer
     * token — never the previous session's — and a failure is never retried,
     * never signs out and never toasts: its caller decides. This is what keeps
     * a failed refresh from triggering another refresh. */
    authRefresh?: boolean;
    /** Set on the one retry after a refresh, so a second 401 signs out. */
    retriedAfterRefresh?: boolean;
    /** The session (services/auth/token.service.ts epoch) the request was
     * sent under; a 401 that comes back after it changed is dropped. */
    sessionEpoch?: number;
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
  const token = config.authRefresh ? null : await getAccessToken();
  // Read right after the token, in the same tick: the pair belongs together.
  config.sessionEpoch = getSessionEpoch();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.authRefresh) {
    delete config.headers.Authorization;
  }
  // Sent on web too (the backend's CORS allow-list includes X-Timezone), so web
  // and native resolve the same local day for daily progress and streaks.
  config.headers['X-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
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

/**
 * A 401 on a request that carried a token: the access token (15 min, B4)
 * expired or the session was revoked. The token to replay it with: the one
 * another request of the SAME session already renewed meanwhile, or a fresh
 * one from ONE refresh (single flight, see services/auth/sessionRefresh.ts).
 * null when the session is really over — or when this already is the replay.
 * Throws the refresh's own error when it couldn't reach the server, and
 * SessionChangedError when the session was replaced.
 */
async function tokenForRetry(config: any): Promise<string | null> {
  if (config.retriedAfterRefresh) return null;
  const epoch: number = config.sessionEpoch;
  const current = await getAccessToken();
  // Same session (checked by the caller), renewed by another request: no second refresh.
  if (current && epoch === getSessionEpoch() && `Bearer ${current}` !== config.headers?.Authorization) {
    return current;
  }
  return refreshSession(api, epoch);
}

/** The request belongs to a session this device no longer holds. */
const fromOtherSession = (config: any) =>
  config?.sessionEpoch !== undefined && config.sessionEpoch !== getSessionEpoch();

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    // Session calls report to their caller only (see `authRefresh`).
    if (config?.authRefresh) return Promise.reject(error);

    // A 401 on a request that carried a token means the session is gone
    // (expired, or the account was banned/deleted): first try to renew it
    // (B4), and only if that fails sign out instead of leaving every screen
    // failing on its own. Requests without a token (login/register) answer
    // 401 for wrong credentials and are left alone.
    if (
      error?.response?.status === 401 &&
      config?.headers?.Authorization &&
      !config?.skipSessionExpiredLogout
    ) {
      // Post-audit: sent by a session that was signed out (or replaced by
      // another account) while it was in flight. Never refresh it, never
      // sign the current session out for it, never replay it with the
      // current session's token: drop it quietly.
      if (fromOtherSession(config)) return Promise.reject(error);

      let token: string | null;
      try {
        token = await tokenForRetry(config);
      } catch (refreshError: any) {
        if (isSessionChangedError(refreshError) || fromOtherSession(config)) {
          return Promise.reject(error);
        }
        // Couldn't renew for a transient reason (offline, timeout, 429, 5xx):
        // keep the session — it may well still be valid, and the next request
        // retries the refresh. Reject with THAT error (on this request's
        // config, so the toast bookkeeping stays right), not with the 401: a
        // caller reading 401 as "signed out" (restoreSession) must not wipe a
        // session that only couldn't be renewed right now (post-audit B4-01-F02).
        if (!config.suppressErrorToast) showApiErrorToast(refreshError);
        if (refreshError && typeof refreshError === 'object') refreshError.config = config;
        return Promise.reject(refreshError);
      }
      if (fromOtherSession(config)) return Promise.reject(error);
      if (token) {
        // Replayed once. The request interceptor sets the stored (new) token
        // again; the replay's own failure goes through this interceptor.
        config.retriedAfterRefresh = true;
        config.headers.Authorization = `Bearer ${token}`;
        return api(config);
      }
      notifySessionExpired();
    }

    if (!config?.suppressErrorToast) {
      showApiErrorToast(error);
    }

    return Promise.reject(error);
  },
);

export default api;
