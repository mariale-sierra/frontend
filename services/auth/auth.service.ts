import api from '../api';
import {
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
  getRefreshToken,
  setSessionTokens,
} from './token.service';
import { storage } from '../../utils/storage';
import type {
  AuthSessionResponse,
  LegalConsent,
  LoginRequest,
  RegisterRequest,
} from '../../types/auth';

export async function login(email: string, password: string) {
  try {
    const payload: LoginRequest = { email, password };
    // The login screen shows its own message for every failure (wrong credentials
    // is a 401 that is not a session expiry), so no global toast on top of it.
    const response = await api.post<AuthSessionResponse>('/auth/login', payload, { suppressErrorToast: true });
    const { accessToken, refreshToken, user } = response.data;

    await setSessionTokens(accessToken, refreshToken);
    if (user?.id) {
      await storage.setItem('userId', String(user.id));
    }
    if (user?.username) {
      await storage.setItem('username', user.username);
    }
    return response.data;
  } catch (error: any) {
    // No log: the login screen tells the user what happened (logError skips
    // these handled 4xx answers anyway).
    throw error;
  }
}

export async function register(
  email: string,
  username: string,
  password: string,
  consent: LegalConsent,
) {
  const payload: RegisterRequest = { email, username, password, ...consent };
  const response = await api.post<AuthSessionResponse>('/auth/register', payload, { suppressErrorToast: true });
  const { accessToken, refreshToken, user } = response.data;
  await setSessionTokens(accessToken, refreshToken);
  if (user?.id) {
    await storage.setItem('userId', String(user.id));
  }
  if (user?.username) {
    await storage.setItem('username', user.username);
  }
  return response.data;
}

/** For accounts that never accepted the current Terms (GET /users/me -> requires_terms_acceptance). */
export async function acceptTerms(consent: LegalConsent) {
  const response = await api.post('/auth/accept-terms', consent);
  return response.data;
}

/** Bounded so signing out never hangs on a bad connection. */
const LOGOUT_REQUEST_TIMEOUT_MS = 5000;

/**
 * Clears the session on this device. With `revokeOnServer` (an explicit
 * logout) it first asks the backend to revoke it (B4: POST /auth/logout), so
 * the refresh token — and within seconds its access token — stop working
 * even if they were copied off the device. Best effort: offline, the local
 * sign-out still happens and the server session just expires (30 days).
 * Skipped when the session already ended server-side (expired / revoked).
 */
export async function logout({ revokeOnServer = true }: { revokeOnServer?: boolean } = {}) {
  const refreshToken = revokeOnServer ? await getRefreshToken().catch(() => null) : null;
  if (refreshToken) {
    await api
      .post(
        '/auth/logout',
        { refreshToken },
        { authRefresh: true, suppressErrorToast: true, timeout: LOGOUT_REQUEST_TIMEOUT_MS },
      )
      .catch(() => undefined);
  }
  await clearAccessToken();
  await clearRefreshToken();
  await storage.removeItem('userId');
  await storage.removeItem('username');
}

export async function getToken() {
  return await getAccessToken();
}

export async function getUserId() {
  return await storage.getItem('userId');
}

export async function getUsername() {
  return await storage.getItem('username');
}

/**
 * Validates the current session against the backend and returns the JWT claims
 * for the authenticated user. Throws (401) if the token is missing/invalid.
 * Centralized here so no component calls the raw `api` client directly.
 */
export async function fetchAuthMe() {
  const response = await api.get('/auth/me');
  return response.data;
}
