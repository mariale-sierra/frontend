import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import api from '../../api';
import { setSessionExpiredHandler } from '../sessionEvents';
import { logout } from '../auth.service';
import {
  beginSession,
  getAccessToken,
  getRefreshToken,
  getSessionEpoch,
  setSessionTokens,
} from '../token.service';

jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { extra: {} } } }));
jest.mock('../../../i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
// The real token.service, over an in-memory store (stands in for SecureStore).
jest.mock('../../../utils/storage', () => {
  const memory = new Map<string, string>();
  const store = {
    getItem: async (key: string) => memory.get(key) ?? null,
    setItem: async (key: string, value: string) => void memory.set(key, value),
    removeItem: async (key: string) => void memory.delete(key),
  };
  return { storage: store, secureStorage: store };
});

const mockToast = jest.fn();
jest.mock('../../../store/errorNotificationStore', () => ({
  useErrorNotificationStore: { getState: () => ({ show: mockToast }) },
}));

type Reply = { status: number; data?: unknown } | 'network' | 'timeout';
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
  if (reply === 'timeout') {
    throw Object.assign(new Error('timeout of 30000ms exceeded'), { code: 'ECONNABORTED', config });
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

/** A promise the test resolves when it wants the server to answer. */
const gate = () => {
  let open: () => void = () => undefined;
  const opened = new Promise<void>((resolve) => (open = resolve));
  return { opened, open };
};

/** A backend whose valid access token is `valid`; /auth/refresh answers `refreshReply`. */
const backend =
  (valid: () => string, refreshReply: () => Reply | Promise<Reply>): Server =>
  (config) => {
    if (config.url === '/auth/refresh') return refreshReply();
    if (config.url === '/auth/logout') return { status: 204 };
    if (config.url === '/auth/login') {
      return { status: 200, data: { accessToken: 'b-access', refreshToken: 'b-refresh', user: { id: 'b' } } };
    }
    return config.headers?.Authorization === `Bearer ${valid()}`
      ? { status: 200, data: { ok: config.url } }
      : { status: 401, data: { message: 'Invalid or expired token' } };
  };

const flush = async (times = 3) => {
  for (let i = 0; i < times; i += 1) await new Promise<void>((resolve) => setImmediate(() => resolve()));
};
const refreshCalls = () => calls.filter((c) => c.url === '/auth/refresh');
const tokens = async () => ({ access: await getAccessToken(), refresh: await getRefreshToken() });

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

  beforeEach(async () => {
    calls.length = 0;
    mockToast.mockReset();
    signedOut.mockReset();
    setSessionExpiredHandler(signedOut);
    await beginSession('expired-access', 'refresh-1');
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
    expect(await tokens()).toEqual({ access: 'access-2', refresh: 'refresh-2' });
    expect(signedOut).not.toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('several requests failing together share ONE refresh (single flight)', async () => {
    const answer = gate();
    server = backend(
      () => 'access-2',
      async () => {
        await answer.opened;
        return { status: 200, data: { accessToken: 'access-2', refreshToken: 'refresh-2' } };
      },
    );

    const pending = Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);
    await flush();
    answer.open();
    const results = await pending;

    expect(results.map((r) => r.data.ok)).toEqual(['/a', '/b', '/c']);
    expect(refreshCalls()).toHaveLength(1);
    expect(signedOut).not.toHaveBeenCalled();
  });

  it('a request that missed an earlier renewal of the same session is replayed without refreshing again', async () => {
    await setSessionTokens('access-2', 'refresh-2'); // renewed by another request meanwhile
    server = backend(
      () => 'access-2',
      () => ({ status: 500 }),
    );
    // Sent with the old token on purpose (same session).
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
    expect(await getRefreshToken()).toBeNull();
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

  // Post-audit B4-01-F02: a refresh that failed for a transient reason must
  // not look like "signed out" to anyone (restoreSession reads 401 so).
  it.each([
    ['network error', 'network' as const, undefined, 'common.errors.networkErrorTitle'],
    ['timeout', 'timeout' as const, undefined, 'common.errors.timeoutTitle'],
    ['429', { status: 429 }, 429, 'common.errors.tooManyRequestsTitle'],
    ['503', { status: 503 }, 503, 'common.errors.serverErrorTitle'],
  ])(
    'keeps the session when the refresh fails with a %s, and rejects with that error instead of the 401',
    async (_label, reply, status, toastTitle) => {
      server = backend(
        () => 'access-2',
        () => reply,
      );

      const error: any = await api.get('/users/me').catch((e) => e);
      await flush();

      expect(error?.response?.status).toBe(status);
      expect(error?.response?.status).not.toBe(401);
      expect(error.config.url).toBe('/users/me');
      expect(signedOut).not.toHaveBeenCalled();
      expect(await tokens()).toEqual({ access: 'expired-access', refresh: 'refresh-1' });
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: toastTitle }));

      // When it's back, the next request renews the same, still valid session.
      server = backend(
        () => 'access-2',
        () => ({ status: 200, data: { accessToken: 'access-2', refreshToken: 'refresh-2' } }),
      );
      await expect(api.get('/users/me')).resolves.toMatchObject({ status: 200 });
    },
  );

  it('a 7-day token from before B4 (no refresh token stored) signs out without calling refresh', async () => {
    await beginSession('expired-access', null);
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

  it('session calls (login/register/refresh/logout) never carry a stored bearer token', async () => {
    server = backend(
      () => 'never',
      () => ({ status: 500 }),
    );
    // A token is still stored: a session call must not send it.
    await api.post('/auth/login', {}, { authRefresh: true, suppressErrorToast: true });
    expect(calls[0]).toMatchObject({ url: '/auth/login', auth: undefined });
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
      expect(await tokens()).toEqual({ access: null, refresh: null });
    });

    it('still signs out locally when the server cannot be reached', async () => {
      server = () => 'network';
      await expect(logout()).resolves.toBeUndefined();
      expect(await tokens()).toEqual({ access: null, refresh: null });
      expect(mockToast).not.toHaveBeenCalled();
      expect(signedOut).not.toHaveBeenCalled();
    });

    it('skips the server call when the session already ended there', async () => {
      server = () => ({ status: 204 });
      await logout({ revokeOnServer: false });
      expect(calls).toHaveLength(0);
      expect(await tokens()).toEqual({ access: null, refresh: null });
    });
  });

  // Post-audit B4-01-F01 and the account-isolation defect: answers that
  // arrive after the session changed must not bring it back nor leak into
  // the next one. Each server answer below is held and released by the test.
  describe('answers that arrive after the session changed', () => {
    it('a refresh answered after the logout does not restore the tokens', async () => {
      const answer = gate();
      server = backend(
        () => 'access-2',
        async () => {
          await answer.opened;
          return { status: 200, data: { accessToken: 'a-access-2', refreshToken: 'a-refresh-2' } };
        },
      );

      const request = api.get('/users/me').catch((e) => e);
      await flush();
      expect(refreshCalls()).toHaveLength(1); // the refresh is in flight

      await logout();
      answer.open();
      const outcome = await request;
      await flush();

      expect(await tokens()).toEqual({ access: null, refresh: null });
      expect(outcome?.response?.status).toBe(401); // the old request just fails
      expect(calls.filter((c) => c.url === '/users/me')).toHaveLength(1); // not replayed
      expect(signedOut).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('A → logout → B: a late refresh of A neither overwrites B nor replays A’s request with B’s token', async () => {
      const answer = gate();
      server = backend(
        () => 'b-access',
        async () => {
          await answer.opened;
          return { status: 200, data: { accessToken: 'a-access-2', refreshToken: 'a-refresh-2' } };
        },
      );

      const requestOfA = api.get('/a/private').catch((e) => e);
      await flush();
      await logout();
      await beginSession('b-access', 'b-refresh'); // B signs in
      answer.open();
      await requestOfA;
      await flush();

      expect(await tokens()).toEqual({ access: 'b-access', refresh: 'b-refresh' });
      expect(calls.some((c) => c.url === '/a/private' && c.auth === 'Bearer b-access')).toBe(false);
      expect(signedOut).not.toHaveBeenCalled();

      // B's own requests are unaffected.
      await expect(api.get('/b/feed')).resolves.toMatchObject({ status: 200 });
    });

    it('A → logout → B: a 401 of A’s request that arrives late triggers no refresh, no replay and no sign-out of B', async () => {
      const answer = gate();
      server = async (config) => {
        if (config.url === '/a/slow') {
          await answer.opened;
          return { status: 401, data: { message: 'Session is no longer valid' } };
        }
        return backend(
          () => 'b-access',
          () => ({ status: 200, data: { accessToken: 'b-access-2', refreshToken: 'b-refresh-2' } }),
        )(config);
      };

      const requestOfA = api.get('/a/slow').catch((e) => e);
      await flush();
      await logout();
      await beginSession('b-access', 'b-refresh');
      answer.open();
      const outcome = await requestOfA;
      await flush();

      expect(outcome?.response?.status).toBe(401);
      expect(refreshCalls()).toHaveLength(0);
      expect(calls.filter((c) => c.url === '/a/slow')).toHaveLength(1);
      expect(await tokens()).toEqual({ access: 'b-access', refresh: 'b-refresh' });
      expect(signedOut).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('A → logout → B: a late 401 to A’s refresh does not clear B’s refresh token', async () => {
      const answer = gate();
      server = backend(
        () => 'b-access',
        async () => {
          await answer.opened;
          return { status: 401, data: { message: 'Invalid refresh token' } };
        },
      );

      const requestOfA = api.get('/a/private').catch((e) => e);
      await flush();
      await logout();
      await beginSession('b-access', 'b-refresh');
      answer.open();
      await requestOfA;
      await flush();

      expect(await tokens()).toEqual({ access: 'b-access', refresh: 'b-refresh' });
      expect(signedOut).not.toHaveBeenCalled();
    });

    it('B never joins the refresh still in flight for A: it gets its own', async () => {
      const answerA = gate();
      let refreshes = 0;
      server = backend(
        () => 'b-access-2',
        async () => {
          refreshes += 1;
          if (refreshes === 1) {
            await answerA.opened;
            return { status: 200, data: { accessToken: 'a-access-2', refreshToken: 'a-refresh-2' } };
          }
          return { status: 200, data: { accessToken: 'b-access-2', refreshToken: 'b-refresh-2' } };
        },
      );

      const requestOfA = api.get('/a/private').catch((e) => e);
      await flush();
      await logout();
      await beginSession('b-expired', 'b-refresh');
      const requestOfB = api.get('/b/feed');
      await expect(requestOfB).resolves.toMatchObject({ data: { ok: '/b/feed' } });
      answerA.open();
      await requestOfA;
      await flush();

      expect(refreshCalls().map((c) => c.body)).toEqual([
        { refreshToken: 'refresh-1' },
        { refreshToken: 'b-refresh' },
      ]);
      expect(await tokens()).toEqual({ access: 'b-access-2', refresh: 'b-refresh-2' });
    });

    it('a logout still clearing does not wipe a session started meanwhile', async () => {
      const logoutAnswer = gate();
      server = async (config) => {
        if (config.url === '/auth/logout') {
          await logoutAnswer.opened;
          return { status: 204 };
        }
        return { status: 200 };
      };

      const pendingLogout = logout();
      await flush();
      await beginSession('b-access', 'b-refresh');
      logoutAnswer.open();
      await pendingLogout;

      expect(await tokens()).toEqual({ access: 'b-access', refresh: 'b-refresh' });
    });

    it('moves the session epoch on login/register and on logout', async () => {
      const start = getSessionEpoch();
      await beginSession('x', 'y');
      expect(getSessionEpoch()).toBe(start + 1);
      server = () => ({ status: 204 });
      await logout();
      expect(getSessionEpoch()).toBe(start + 2);
    });
  });
});
