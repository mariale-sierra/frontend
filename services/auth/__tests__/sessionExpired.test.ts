import api from '../../api';
import { notifySessionExpired, setSessionExpiredHandler } from '../sessionEvents';

jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { extra: {} } } }));
jest.mock('../token.service', () => ({ getAccessToken: jest.fn(() => Promise.resolve(null)) }));
jest.mock('../../../i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));

type Rejected = (error: unknown) => Promise<unknown>;
// The shared client's response error interceptor (services/api.ts).
const onError = (api.interceptors.response as unknown as {
  handlers: Array<{ rejected: Rejected }>;
}).handlers[0].rejected;

const unauthorized = (config: Record<string, unknown>) => ({
  response: { status: 401, data: { message: 'Invalid or expired token' } },
  config,
});

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

describe('session expiry (auto logout on 401)', () => {
  const handler = jest.fn();

  beforeEach(() => {
    handler.mockReset();
    setSessionExpiredHandler(handler);
  });

  afterAll(() => setSessionExpiredHandler(null));

  it('signs out when an authenticated request answers 401', async () => {
    await expect(
      onError(unauthorized({ headers: { Authorization: 'Bearer old' } })),
    ).rejects.toBeTruthy();
    await flush();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('also signs out on background calls that hide the toast', async () => {
    await onError(
      unauthorized({ headers: { Authorization: 'Bearer old' }, suppressErrorToast: true }),
    ).catch(() => undefined);
    await flush();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('leaves login/register alone (no token: 401 means wrong credentials)', async () => {
    await onError(unauthorized({ headers: {} })).catch(() => undefined);
    await flush();
    expect(handler).not.toHaveBeenCalled();
  });

  it('leaves endpoints that use 401 for a wrong password alone', async () => {
    await onError(
      unauthorized({
        headers: { Authorization: 'Bearer ok' },
        suppressErrorToast: true,
        skipSessionExpiredLogout: true,
      }),
    ).catch(() => undefined);
    await flush();
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not sign out on other errors', async () => {
    await onError({
      response: { status: 404, data: {} },
      config: { headers: { Authorization: 'Bearer ok' } },
    }).catch(() => undefined);
    await flush();
    expect(handler).not.toHaveBeenCalled();
  });

  it('signs out once when several requests fail together', async () => {
    let release: () => void = () => undefined;
    handler.mockImplementation(() => new Promise<void>((resolve) => (release = resolve)));

    notifySessionExpired();
    notifySessionExpired();
    notifySessionExpired();
    await flush();
    expect(handler).toHaveBeenCalledTimes(1);

    release();
    await flush();
    notifySessionExpired();
    await flush();
    expect(handler).toHaveBeenCalledTimes(2);
  });
});
