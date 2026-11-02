import api from '../../api';
import { acceptTerms, fetchAuthMe, login, register } from '../auth.service';
import { beginSession } from '../token.service';
import { storage } from '../../../utils/storage';

// Sprint 10, B10: login/register as the screens see them (the API client and
// the token storage are mocked at their boundary).
jest.mock('../../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('../token.service', () => ({
  beginSession: jest.fn(() => Promise.resolve()),
  clearAccessToken: jest.fn(),
  clearRefreshToken: jest.fn(),
  endSessionEpoch: jest.fn(),
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  getSessionEpoch: jest.fn(),
}));
jest.mock('../../../utils/storage', () => ({
  storage: { getItem: jest.fn(), setItem: jest.fn(() => Promise.resolve()), removeItem: jest.fn() },
}));

const post = api.post as jest.Mock;
const session = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  user: { id: 42, username: 'ana', email: 'ana@example.com' },
};
const consent = { acceptTerms: true, confirmAge16: true };

describe('auth service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('starts the session and remembers who signed in', async () => {
      post.mockResolvedValue({ data: session });

      await expect(login('ana@example.com', 'correct horse')).resolves.toEqual(session);

      expect(post).toHaveBeenCalledWith(
        '/auth/login',
        { email: 'ana@example.com', password: 'correct horse' },
        // The screen shows its own message, and no stale bearer is sent.
        { suppressErrorToast: true, authRefresh: true },
      );
      expect(beginSession).toHaveBeenCalledWith('access-1', 'refresh-1');
      expect(storage.setItem).toHaveBeenCalledWith('userId', '42');
      expect(storage.setItem).toHaveBeenCalledWith('username', 'ana');
    });

    it('stores no identity the server did not send', async () => {
      post.mockResolvedValue({ data: { accessToken: 'access-1', user: {} } });

      await login('ana@example.com', 'correct horse');

      expect(beginSession).toHaveBeenCalledWith('access-1', undefined);
      expect(storage.setItem).not.toHaveBeenCalled();
    });

    it('hands the very same error to the screen and starts no session', async () => {
      const wrongPassword = Object.assign(new Error('Request failed with status code 401'), {
        response: { status: 401, data: { message: 'Invalid credentials' } },
      });
      post.mockRejectedValue(wrongPassword);

      await expect(login('ana@example.com', 'nope')).rejects.toBe(wrongPassword);
      expect(beginSession).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('sends the legal consent with the account and starts the session', async () => {
      post.mockResolvedValue({ data: session });

      await expect(register('ana@example.com', 'ana', 'correct horse', consent)).resolves.toEqual(session);

      expect(post).toHaveBeenCalledWith(
        '/auth/register',
        { email: 'ana@example.com', username: 'ana', password: 'correct horse', acceptTerms: true, confirmAge16: true },
        { suppressErrorToast: true, authRefresh: true },
      );
      expect(beginSession).toHaveBeenCalledWith('access-1', 'refresh-1');
      expect(storage.setItem).toHaveBeenCalledWith('userId', '42');
    });

    it('lets a taken account error reach the screen', async () => {
      const taken = Object.assign(new Error('conflict'), { response: { status: 409 } });
      post.mockRejectedValue(taken);

      await expect(register('ana@example.com', 'ana', 'correct horse', consent)).rejects.toBe(taken);
      expect(beginSession).not.toHaveBeenCalled();
    });
  });

  it('accepts the current terms for an existing account', async () => {
    post.mockResolvedValue({ data: { ok: true } });
    await expect(acceptTerms(consent)).resolves.toEqual({ ok: true });
    expect(post).toHaveBeenCalledWith('/auth/accept-terms', consent);
  });

  it('reads the session claims from /auth/me', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { sub: 'u1' } });
    await expect(fetchAuthMe()).resolves.toEqual({ sub: 'u1' });
    expect(api.get).toHaveBeenCalledWith('/auth/me');
  });
});
