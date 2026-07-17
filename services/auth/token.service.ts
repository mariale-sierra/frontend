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
