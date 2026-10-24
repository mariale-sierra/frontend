import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import api from '../../api';
import { setSessionExpiredHandler } from '../sessionEvents';
import { logout } from '../auth.service';

jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { extra: {} } } }));
jest.mock('../../../i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock('../../../utils/storage', () => ({
  storage: { setItem: jest.fn(), getItem: jest.fn(), removeItem: jest.fn() },
}));

// In-memory session (stands in for SecureStore).
const mockTokens: { access: string | null; refresh: string | null } = { access: null, refresh: null };
jest.mock('../token.service', () => ({
  getAccessToken: jest.fn(async () => mockTokens.access),
  getRefreshToken: jest.fn(async () => mockTokens.refresh),
  setSessionTokens: jest.fn(async (access: string, refresh?: string | null) => {
    mockTokens.access = access;
    mockTokens.refresh = refresh ?? null;
  }),
  clearAccessToken: jest.fn(async () => {
    mockTokens.access = null;
  }),
  clearRefreshToken: jest.fn(async () => {
    mockTokens.refresh = null;
  }),
}));

const mockToast = jest.fn();
jest.mock('../../../store/errorNotificationStore', () => ({
  useErrorNotificationStore: { getState: () => ({ show: mockToast }) },
}));

type Reply = { status: number; data?: unknown } | 'network';
type Server = (config: InternalAxiosRequestConfig) => Reply | Promise<Reply>;

const calls: Array<{ url?: string; auth?: string; body?: unknown }> = [];
let server: Server;

/** Fake HTTP layer under the real client and its interceptors. */
const adapter: AxiosAdapter = async (config) => {
  const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
  calls.push({ url: config.url, auth: config.headers?.Authorization as string | undefined, body });
  const reply = await server(config);
  if (reply === 'network') {
    throw Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK', config });
  }
  const response = { data: reply.data ?? {}, status: reply.status, statusText: '', headers: {}, config };
  if (reply.status >= 400) {
    throw Object.assign(new Error(`Request failed with status code ${reply.status}`), {
      config,
      response,
      isAxiosError: true,
    });
  }
  return response;
};

/** A backend whose valid access token is `valid`; /auth/refresh answers `refreshReply`. */
const backend =
  (valid: () => string, refreshReply: () => Reply | Promise<Reply>): Server =>
  (config) => {
    if (config.url === '/auth/refresh') return refreshReply();
    if (config.url === '/auth/logout') return { status: 204 };
    return config.headers?.Authorization === `Bearer ${valid()}`
      ? { status: 200, data: { ok: config.url } }
      : { status: 401, data: { message: 'Invalid or expired token' } };
  };

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));
const refreshCalls = () => calls.filter((c) => c.url === '/auth/refresh');

describe('B4 session refresh in the shared API client', () => {
  const signedOut = jest.fn();
  const originalAdapter = api.defaults.adapter;

  beforeAll(() => {
    api.defaults.adapter = adapter;
  });
  afterAll(() => {
    api.defaults.adapter = originalAdapter;
    setSessionExpiredHandler(null);
  });

  beforeEach(() => {
    calls.length = 0;
    mockToast.mockReset();
    signedOut.mockReset();
    setSessionExpiredHandler(signedOut);
    mockTokens.access = 'expired-access';
    mockTokens.refresh = 'refresh-1';
  });

  it('renews an expired access token once and replays the request with the new one', async () => {
    server = backend(
      () => 'access-2',
      () => ({ status: 200, data: { accessToken: 'access-2', refreshToken: 'refresh-2' } }),
    );

    const res = await api.get('/users/me');

    expect(res.data).toEqual({ ok: '/users/me' });
    expect(calls.map((c) => [c.url, c.auth])).toEqual([
      ['/users/me', 'Bearer expired-access'],
      // The refresh call carries no bearer token, only the refresh token.
      ['/auth/refresh', undefined],
      ['/users/me', 'Bearer access-2'],
    ]);
    expect(refreshCalls()[0].body).toEqual({ refreshToken: 'refresh-1' });
    // Rotation: the new refresh token replaces the used one.
    expect(mockTokens).toEqual({ access: 'access-2', refresh: 'refresh-2' });
    expect(signedOut).not.toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('several requests failing together share ONE refresh (single flight)', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server = backend(
      () => 'access-2',
      async () => {
        await gate;
        return { status: 200, data: { accessToken: 'access-2', refreshToken: 'refresh-2' } };
      },
    );

    const pending = Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);
    await flush();
    await flush();
    release();
    const results = await pending;

    expect(results.map((r) => r.data.ok)).toEqual(['/a', '/b', '/c']);
    expect(refreshCalls()).toHaveLength(1);
    expect(signedOut).not.toHaveBeenCalled();
  });

  it('a request that missed an earlier renewal is replayed without refreshing again', async () => {
    mockTokens.access = 'access-2'; // renewed by another request meanwhile
    server = backend(
      () => 'access-2',
      () => ({ status: 500 }),
    );
    // Sent with the old token on purpose.
    const res = await api.get('/late', { headers: { Authorization: 'Bearer expired-access' } });
    expect(res.data).toEqual({ ok: '/late' });
    expect(refreshCalls()).toHaveLength(0);
  });

  it('signs out when the refresh is rejected (closed, revoked or reused session)', async () => {
    server = backend(
      () => 'never',
      () => ({ status: 401, data: { message: 'Invalid refresh token' } }),
    );

    await expect(api.get('/users/me')).rejects.toMatchObject({ response: { status: 401 } });
    await flush();

    expect(refreshCalls()).toHaveLength(1);
    expect(calls.filter((c) => c.url === '/users/me')).toHaveLength(1); // no replay
    expect(mockTokens.refresh).toBeNull();
    expect(signedOut).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'common.errors.sessionExpiredTitle' }),
    );
  });

  it('retries only once: a replay that still answers 401 signs out (no loop)', async () => {
    server = backend(
      () => 'never', // e.g. the account was banned between the two requests
      () => ({ status: 200, data: { accessToken: 'access-2', refreshToken: 'refresh-2' } }),
    );

    await expect(api.get('/users/me')).rejects.toMatchObject({ response: { status: 401 } });
    await flush();

    expect(refreshCalls()).toHaveLength(1);
    expect(calls.filter((c) => c.url === '/users/me')).toHaveLength(2);
    expect(signedOut).toHaveBeenCalledTimes(1);
  });

  it('keeps the session when the refresh cannot reach the server', async () => {
    server = backend(
      () => 'access-2',
      () => 'network',
    );

    await expect(api.get('/users/me')).rejects.toMatchObject({ response: { status: 401 } });
    await flush();

    expect(signedOut).not.toHaveBeenCalled();
    expect(mockTokens.refresh).toBe('refresh-1');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'common.errors.networkErrorTitle' }),
    );
  });

  it('a 7-day token from before B4 (no refresh token stored) signs out without calling refresh', async () => {
    mockTokens.refresh = null;
    server = backend(
      () => 'never',
      () => ({ status: 500 }),
    );

    await expect(api.get('/users/me')).rejects.toBeTruthy();
    await flush();

    expect(refreshCalls()).toHaveLength(0);
    expect(signedOut).toHaveBeenCalledTimes(1);
  });

  it('does not refresh for endpoints whose 401 means a wrong password', async () => {
    server = backend(
      () => 'never',
      () => ({ status: 200, data: { accessToken: 'x', refreshToken: 'y' } }),
    );

    await api
      .post('/users/me/deletion', {}, { skipSessionExpiredLogout: true, suppressErrorToast: true })
      .catch(() => undefined);
    await flush();

    expect(refreshCalls()).toHaveLength(0);
    expect(signedOut).not.toHaveBeenCalled();
  });

  it('leaves login (no token sent) alone', async () => {
    mockTokens.access = null;
    server = () => ({ status: 401, data: { message: 'Invalid email or password' } });

    await api.post('/auth/login', {}, { suppressErrorToast: true }).catch(() => undefined);
    await flush();

    expect(refreshCalls()).toHaveLength(0);
    expect(signedOut).not.toHaveBeenCalled();
  });

  describe('logout', () => {
    it('revokes the session on the server, then clears it locally', async () => {
      server = backend(
        () => 'expired-access',
        () => ({ status: 500 }),
      );

      await logout();

      const logoutCall = calls.find((c) => c.url === '/auth/logout');
      expect(logoutCall).toEqual({ url: '/auth/logout', auth: undefined, body: { refreshToken: 'refresh-1' } });
      expect(mockTokens).toEqual({ access: null, refresh: null });
    });

    it('still signs out locally when the server cannot be reached', async () => {
      server = () => 'network';
      await expect(logout()).resolves.toBeUndefined();
      expect(mockTokens).toEqual({ access: null, refresh: null });
      expect(mockToast).not.toHaveBeenCalled();
      expect(signedOut).not.toHaveBeenCalled();
    });

    it('skips the server call when the session already ended there', async () => {
      server = () => ({ status: 204 });
      await logout({ revokeOnServer: false });
      expect(calls).toHaveLength(0);
      expect(mockTokens).toEqual({ access: null, refresh: null });
    });
  });
});
