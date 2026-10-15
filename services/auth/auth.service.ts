import api from '../api';
import { clearAccessToken, getAccessToken, setAccessToken } from './token.service';
import { storage } from '../../utils/storage';
import type {
  AuthSessionResponse,
  LegalConsent,
  LoginRequest,
  RegisterRequest,
} from '../../types/auth';
import { logError } from '../../utils/apiError';

export async function login(email: string, password: string) {
  try {
    const payload: LoginRequest = { email, password };
    // The login screen shows its own message for every failure (wrong credentials
    // is a 401 that is not a session expiry), so no global toast on top of it.
    const response = await api.post<AuthSessionResponse>('/auth/login', payload, { suppressErrorToast: true });
    const { accessToken, user } = response.data;

    await setAccessToken(accessToken);
    if (user?.id) {
      await storage.setItem('userId', String(user.id));
    }
    if (user?.username) {
      await storage.setItem('username', user.username);
    }
    return response.data;
  } catch (error: any) {
    logError('auth.login', error);
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
  const { accessToken, user } = response.data;
  await setAccessToken(accessToken);
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

export async function logout() {
  await clearAccessToken();
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
