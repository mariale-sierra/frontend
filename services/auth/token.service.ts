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
