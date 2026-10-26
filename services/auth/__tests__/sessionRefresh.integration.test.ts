/**
 * B4 — the app's real API client (services/api.ts + auth.service + the
 * interceptor's refresh) against a REAL backend. Opt-in: skipped unless
 * HAVIT_B4_API_URL points at a backend running on a disposable database,
 * e.g. the local one described in docs/sprint-10/B4-sesiones-tokens.md:
 *
 *   HAVIT_B4_API_URL=http://localhost:3999 npx jest sessionRefresh.integration
 *
 * NEVER point it at production: it creates accounts. It registers 3 (the
 * backend allows 5 per IP every 10 minutes).
 */
import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import api from '../../api';
import { login, logout, register } from '../auth.service';
import { getAccessToken, getRefreshToken, setAccessToken } from '../token.service';
import { setSessionExpiredHandler } from '../sessionEvents';
import { knownApiMessageKey } from '../../../utils/apiError';

const apiUrl = process.env.HAVIT_B4_API_URL;
const describeApi = apiUrl ? describe : describe.skip;

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiUrl: process.env.HAVIT_B4_API_URL ?? 'http://localhost:1' } } },
}));
jest.mock('../../../i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock('../../../store/errorNotificationStore', () => ({
  useErrorNotificationStore: { getState: () => ({ show: () => undefined }) },
}));
jest.mock('../../../utils/storage', () => {
  const memory = new Map<string, string>();
  const store = {
    getItem: async (key: string) => memory.get(key) ?? null,
    setItem: async (key: string, value: string) => void memory.set(key, value),
    removeItem: async (key: string) => void memory.delete(key),
  };
  return { storage: store, secureStorage: store };
});

/**
 * jest-expo replaces XHR and fetch with React Native's, which can't reach a
 * real server from Node: a minimal adapter on Node's own http module.
 */
const nodeHttp: AxiosAdapter = (config: InternalAxiosRequestConfig) =>
  new Promise((resolve, reject) => {
    const http = jest.requireActual('http') as typeof import('http');
    const url = new URL(config.url ?? '', config.baseURL);
    const headers: Record<string, string> = {};
    Object.entries(config.headers?.toJSON?.() ?? {}).forEach(([key, value]) => {
      if (value != null) headers[key] = String(value);
    });
    const req = http.request(url, { method: (config.method ?? 'get').toUpperCase(), headers }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const response = {
          data: body,
          status: res.statusCode ?? 0,
          statusText: res.statusMessage ?? '',
          headers: res.headers as Record<string, string>,
          config,
        };
        const validate = config.validateStatus ?? ((status: number) => status >= 200 && status < 300);
        if (validate(response.status)) resolve(response);
        else reject(new AxiosError(`Request failed with status code ${response.status}`, 'ERR_BAD_RESPONSE', config, req, response));
      });
    });
    req.on('error', (error) => reject(AxiosError.from(error, 'ERR_NETWORK', config, req)));
    if (config.data != null) req.write(config.data);
    req.end();
  });

const PASSWORD = 'Montaña-Lenta-Azul';
const consent = { acceptTerms: true, confirmAge16: true };
const tag = () => Math.random().toString(36).slice(2, 10);

describeApi('B4 app client <-> real backend', () => {
  const refreshCalls: string[] = [];
  const signedOut = jest.fn();
  const raw = axios.create({ baseURL: apiUrl, validateStatus: () => true, adapter: nodeHttp });

  beforeAll(() => {
    // The real network, counting refreshes.
    const counting: AxiosAdapter = (config) => {
      if (config.url === '/auth/refresh') refreshCalls.push(String(config.data));
      return nodeHttp(config);
    };
    api.defaults.adapter = counting;
    setSessionExpiredHandler(signedOut);
  });

  afterAll(() => setSessionExpiredHandler(null));

  beforeEach(() => {
    refreshCalls.length = 0;
    signedOut.mockReset();
  });

  const email = `b4fe_${tag()}@example.com`;
  const username = `b4fe_${tag()}`;

  it('register stores both tokens; an invalid/expired access token is renewed transparently', async () => {
    const res = await register(email, username, PASSWORD, consent);
    expect(res.refreshToken).toBeTruthy();
    expect(await getRefreshToken()).toBe(res.refreshToken);

    const me = await api.get('/auth/me');
    expect(me.data.sub).toBe(res.user.id);

    // As if its 15 minutes were over.
    await setAccessToken('expired.or.garbage');
    const again = await api.get('/auth/me');
    expect(again.data.sub).toBe(res.user.id);
    expect(refreshCalls).toHaveLength(1);
    expect(await getRefreshToken()).not.toBe(res.refreshToken); // rotated
    expect(signedOut).not.toHaveBeenCalled();
  });

  it('several requests failing together share one refresh', async () => {
    await setAccessToken('expired.or.garbage');
    const results = await Promise.all([api.get('/auth/me'), api.get('/auth/me'), api.get('/auth/me')]);
    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(refreshCalls).toHaveLength(1);
  });

  it('logout revokes the session on the server: neither token works afterwards', async () => {
    const access = (await getAccessToken()) as string;
    const refresh = (await getRefreshToken()) as string;

    await logout();

    expect(await getAccessToken()).toBeNull();
    expect((await raw.get('/auth/me', { headers: { Authorization: `Bearer ${access}` } })).status).toBe(401);
    expect((await raw.post('/auth/refresh', { refreshToken: refresh })).status).toBe(401);
  });

  it('a reused refresh token kills the session and the app signs out', async () => {
    await login(email, PASSWORD);
    const first = (await getRefreshToken()) as string;
    await setAccessToken('expired.or.garbage');
    await api.get('/auth/me'); // rotates: first -> second
    expect(await getRefreshToken()).not.toBe(first);

    // Someone else replays the old token: the backend revokes the family.
    expect((await raw.post('/auth/refresh', { refreshToken: first })).status).toBe(401);

    await setAccessToken('expired.or.garbage');
    await expect(api.get('/auth/me')).rejects.toMatchObject({ response: { status: 401 } });
    await new Promise((resolve) => setImmediate(resolve));
    expect(signedOut).toHaveBeenCalledTimes(1);
    expect(await getRefreshToken()).toBeNull();
  });

  it('maps the B4 registration answers to their messages', async () => {
    const weak = await register(`b4fe_${tag()}@example.com`, `b4fe_${tag()}`, 'password123', consent).catch(
      (e) => e,
    );
    expect(weak.response.status).toBe(400);
    expect(knownApiMessageKey(weak)).toBe('passwordTooCommon');

    const taken = await register(email, `b4fe_${tag()}`, PASSWORD, consent).catch((e) => e);
    expect(taken.response.status).toBe(409);
    expect(knownApiMessageKey(taken)).toBe('accountTaken');
  });
});
