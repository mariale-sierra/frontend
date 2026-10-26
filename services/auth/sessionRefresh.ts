import type { AxiosInstance } from 'axios';
import {
  clearRefreshToken,
  getRefreshToken,
  getSessionEpoch,
  setSessionTokens,
} from './token.service';
import type { AuthSessionResponse } from '../../types/auth';
import { getApiErrorStatus } from '../../utils/apiError';

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
let inFlight: { epoch: number; promise: Promise<string | null> } | null = null;

/**
 * The session this refresh was started for was replaced (logout, or another
 * account signed in) before it finished. Its result was discarded — nothing
 * was stored or cleared — and the request that triggered it must just fail
 * quietly: it belonged to a session that no longer exists on this device.
 */
export class SessionChangedError extends Error {
  constructor() {
    super('The session changed while it was being renewed');
    this.name = 'SessionChangedError';
  }
}

export function isSessionChangedError(error: unknown): error is SessionChangedError {
  return error instanceof SessionChangedError;
}

/**
 * Resolves the new access token, or null when the session is over (no
 * refresh token stored — e.g. a 7-day token from before B4 — or the server
 * answered 401/400: invalid, expired, revoked or reused, all the same 401).
 * Rejects with the refresh's own error on a network error, a timeout, a 429
 * or a 5xx: the session may still be fine, so the caller must keep it.
 * Rejects with SessionChangedError when `epoch` is no longer the current
 * session (post-audit B4-01-F01).
 */
export function refreshSession(
  client: AxiosInstance,
  epoch: number = getSessionEpoch(),
): Promise<string | null> {
  if (epoch !== getSessionEpoch()) return Promise.reject(new SessionChangedError());
  // Shared only within one session: a refresh of an older session never
  // answers for the current one.
  if (!inFlight || inFlight.epoch !== epoch) {
    const promise = runRefresh(client, epoch).finally(() => {
      if (inFlight?.promise === promise) inFlight = null;
    });
    inFlight = { epoch, promise };
  }
  return inFlight.promise;
}

async function runRefresh(client: AxiosInstance, epoch: number): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (epoch !== getSessionEpoch()) throw new SessionChangedError();
  if (!refreshToken) return null;

  let response;
  try {
    response = await client.post<AuthSessionResponse>(
      '/auth/refresh',
      { refreshToken },
      // authRefresh: no bearer, and the response interceptor neither retries,
      // signs out nor toasts for it — this function decides.
      { authRefresh: true, suppressErrorToast: true },
    );
  } catch (error) {
    // Whatever the server said, it was about a session that's gone: don't
    // touch the tokens the new one stored.
    if (epoch !== getSessionEpoch()) throw new SessionChangedError();
    const status = getApiErrorStatus(error);
    // 401: unknown, expired, revoked or reused — this session can't be renewed.
    // 400: what we hold isn't even a refresh token.
    if (status === 401 || status === 400) {
      await clearRefreshToken();
      return null;
    }
    throw error;
  }

  // Signed out (or someone else signed in) while the answer was on its way:
  // storing it would bring a closed session back, or overwrite theirs.
  if (epoch !== getSessionEpoch()) throw new SessionChangedError();
  const { accessToken, refreshToken: next } = response.data;
  await setSessionTokens(accessToken, next);
  return accessToken;
}
