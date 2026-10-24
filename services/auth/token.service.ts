import { secureStorage } from '../../utils/storage';

const TOKEN_KEY = 'token';

let tokenInMemory: string | null = null;
let tokenHydrated = false;
let hydrationPromise: Promise<void> | null = null;

async function hydrateTokenIfNeeded() {
  if (tokenHydrated) {
    return;
  }

  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      tokenInMemory = await secureStorage.getItem(TOKEN_KEY);
      tokenHydrated = true;
    })().finally(() => {
      hydrationPromise = null;
    });
  }

  await hydrationPromise;
}

export async function getAccessToken() {
  await hydrateTokenIfNeeded();
  return tokenInMemory;
}

export async function setAccessToken(token: string) {
  tokenInMemory = token;
  tokenHydrated = true;
  await secureStorage.setItem(TOKEN_KEY, token);
}

export async function clearAccessToken() {
  tokenInMemory = null;
  tokenHydrated = true;
  await secureStorage.removeItem(TOKEN_KEY);
}

// B4: the opaque refresh token that renews the 15-minute access token. Only
// ever read when a refresh or a logout needs it, so no in-memory copy.
const REFRESH_TOKEN_KEY = 'refreshToken';

export async function getRefreshToken() {
  return secureStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Stores a login/register/refresh answer. A backend from before B4 sends no
 * refresh token: then only the access token is kept, as before.
 */
export async function setSessionTokens(accessToken: string, refreshToken?: string | null) {
  await setAccessToken(accessToken);
  if (refreshToken) {
    await secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    await secureStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export async function clearRefreshToken() {
  await secureStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Post-audit (B4-01-F01 and the account-isolation defect): a generation
 * number for "the session this device holds". It moves on whenever that
 * session is replaced — login/register (beginSession) or sign-out
 * (endSession) — so anything started under an older one (a refresh in
 * flight, a request that comes back with a 401) can tell its answer is
 * stale and drop it: it must neither store tokens, nor clear the new
 * session's, nor be replayed with the new session's token.
 */
let sessionEpoch = 0;

export function getSessionEpoch() {
  return sessionEpoch;
}

/** Login/register: a new session replaces whatever this device held. */
export async function beginSession(accessToken: string, refreshToken?: string | null) {
  sessionEpoch += 1;
  await setSessionTokens(accessToken, refreshToken);
}

/**
 * Sign-out: from this call on, nothing started under the old session can
 * write tokens back. Returns the new epoch, so the caller can check nobody
 * signed in again before it finishes clearing.
 */
export function endSessionEpoch() {
  sessionEpoch += 1;
  return sessionEpoch;
}
