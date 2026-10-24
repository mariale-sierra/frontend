import type { AxiosInstance } from 'axios';
import { clearRefreshToken, getRefreshToken, setSessionTokens } from './token.service';
import type { AuthSessionResponse } from '../../types/auth';

/**
 * B4 — renews the session when an authenticated request answers 401 (the
 * access token lasts 15 minutes). Lives apart from services/api.ts, which
 * calls it with itself as `client`, so there's still one Axios client.
 *
 * Single flight: several requests usually fail together when the access
 * token expires; they all wait on ONE POST /auth/refresh. That matters for
 * correctness, not just traffic — the backend rotates the refresh token on
 * every use and treats a second use of the old one as theft (it revokes the
 * whole session).
 */
let inFlight: Promise<string | null> | null = null;

/**
 * Resolves the new access token, or null when the session is over (no
 * refresh token stored — e.g. a 7-day token from before B4 — or the server
 * rejected it). Rejects on a network/server error: the session may still be
 * fine, so the caller must not sign the user out for that.
 */
export function refreshSession(client: AxiosInstance): Promise<string | null> {
  if (!inFlight) {
    inFlight = runRefresh(client).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function runRefresh(client: AxiosInstance): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await client.post<AuthSessionResponse>(
      '/auth/refresh',
      { refreshToken },
      // authRefresh: no bearer, and the response interceptor neither retries,
      // signs out nor toasts for it — this function decides.
      { authRefresh: true, suppressErrorToast: true },
    );
    const { accessToken, refreshToken: next } = response.data;
    await setSessionTokens(accessToken, next);
    return accessToken;
  } catch (error: any) {
    const status = error?.response?.status;
    // 401: unknown, expired, revoked or reused — this session can't be renewed.
    // 400: what we hold isn't even a refresh token.
    if (status === 401 || status === 400) {
      await clearRefreshToken();
      return null;
    }
    throw error;
  }
}
