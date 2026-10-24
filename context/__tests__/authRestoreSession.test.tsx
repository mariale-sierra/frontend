import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import type { AxiosAdapter } from 'axios';
import api from '../../services/api';
import { AuthProvider, useAuth } from '../authContext';
import {
  getAccessToken,
  getRefreshToken,
  setSessionTokens,
} from '../../services/auth/token.service';

/**
 * Post-audit B4-01-F02 — cold start with the REAL auth service, token service
 * and API client (only the HTTP layer and the storage are fake): the stored
 * access token is expired (it lasts 15 minutes), so /auth/me answers 401 and
 * the client tries to renew. Only a definitive refusal of the refresh may end
 * the session; a transient failure must keep it for the next attempt.
 */
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { extra: {} } } }));
jest.mock('../../i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock('../../store/errorNotificationStore', () => ({
  useErrorNotificationStore: { getState: () => ({ show: jest.fn() }) },
}));
jest.mock('../../hooks/useChallengeProgress', () => ({
  invalidateChallengeProgressCache: jest.fn(),
}));
jest.mock('../../services/notifications/pushNotifications', () => ({
  forgetPushToken: jest.fn(() => Promise.resolve()),
  unregisterPushToken: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../utils/storage', () => {
  // What a previous run of the app left on the device.
  const memory = new Map<string, string>([
    ['token', 'expired-access'],
    ['refreshToken', 'refresh-1'],
    ['userId', 'u1'],
    ['username', 'ana'],
  ]);
  const store = {
    getItem: async (key: string) => memory.get(key) ?? null,
    setItem: async (key: string, value: string) => void memory.set(key, value),
    removeItem: async (key: string) => void memory.delete(key),
  };
  return { storage: store, secureStorage: store };
});

type Reply = { status: number; data?: unknown } | 'network';
let refreshReply: Reply;
const urls: string[] = [];

const adapter: AxiosAdapter = async (config) => {
  urls.push(String(config.url));
  const reply: Reply =
    config.url === '/auth/refresh'
      ? refreshReply
      : config.headers?.Authorization === 'Bearer access-2'
        ? { status: 200, data: { sub: 'u1' } }
        : { status: 401, data: { message: 'Invalid or expired token' } };
  if (reply === 'network') {
    throw Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK', config });
  }
  const response = { data: reply.data ?? {}, status: reply.status, statusText: '', headers: {}, config };
  if (reply.status >= 400) {
    throw Object.assign(new Error(`status ${reply.status}`), { config, response, isAxiosError: true });
  }
  return response;
};

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 20));

describe('AuthProvider — restoring a session at startup (B4)', () => {
  beforeAll(() => {
    api.defaults.adapter = adapter;
  });

  beforeEach(() => {
    urls.length = 0;
  });

  // Runs first: the stored session is intact for each transient case.
  it.each([
    ['no connection', 'network' as const],
    ['429', { status: 429 }],
    ['503', { status: 503 }],
  ])('keeps the stored session when the refresh fails with %s', async (_label, reply) => {
    refreshReply = reply;
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(urls).toContain('/auth/refresh'));
    await settle();

    expect(result.current.isAuthenticated).toBe(true);
    expect(await getRefreshToken()).toBe('refresh-1');
    expect(await getAccessToken()).toBe('expired-access');
  });

  it('renews the session when the refresh works', async () => {
    refreshReply = { status: 200, data: { accessToken: 'access-2', refreshToken: 'refresh-2' } };
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(urls.filter((u) => u === '/auth/me')).toHaveLength(2));
    await settle();

    expect(result.current.isAuthenticated).toBe(true);
    expect(await getRefreshToken()).toBe('refresh-2');
  });

  it('signs out (and clears the tokens) when the server refuses the refresh', async () => {
    refreshReply = { status: 401, data: { message: 'Invalid refresh token' } };
    // An expired access token again (the previous case renewed it).
    await setSessionTokens('expired-again', 'refresh-2');

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));

    expect(await getRefreshToken()).toBeNull();
    expect(await getAccessToken()).toBeNull();
  });
});
