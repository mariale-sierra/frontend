import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../authContext';
import {
  getToken,
  getUserId,
  getUsername,
  login as loginService,
  logout as logoutService,
  register as registerService,
} from '../../services/auth/auth.service';
import { unregisterPushToken } from '../../services/notifications/pushNotifications';
import { invalidateChallengeProgressCache } from '../../hooks/useChallengeProgress';

// Sprint 10, B10: signing in, signing up and signing out through the context
// (the screens only await these; the session state is what they rely on).
jest.mock('../../services/auth/auth.service', () => ({
  fetchAuthMe: jest.fn(() => Promise.resolve({ sub: 'u1' })),
  getToken: jest.fn(),
  getUserId: jest.fn(),
  getUsername: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(() => Promise.resolve()),
  register: jest.fn(),
}));
jest.mock('../../hooks/useChallengeProgress', () => ({
  invalidateChallengeProgressCache: jest.fn(),
}));
jest.mock('../../services/notifications/pushNotifications', () => ({
  forgetPushToken: jest.fn(() => Promise.resolve()),
  unregisterPushToken: jest.fn(() => Promise.resolve()),
}));

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
const session = { accessToken: 'access-1', refreshToken: 'refresh-1', user: { id: 'u1', username: 'ana' } };
const consent = { acceptTerms: true, confirmAge16: true };

async function signedOut() {
  const { result } = await renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.isRestoring).toBe(false));
  return result;
}

describe('AuthProvider — login, register and logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Nothing stored on the device: the app starts signed out.
    (getToken as jest.Mock).mockResolvedValue(null);
    (getUserId as jest.Mock).mockResolvedValue(null);
    (getUsername as jest.Mock).mockResolvedValue(null);
  });

  it('starts signed out when nothing is stored', async () => {
    const result = await signedOut();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
  });

  it('signs in with the session the server returned, and returns it', async () => {
    (loginService as jest.Mock).mockResolvedValue(session);
    const result = await signedOut();

    let returned: unknown;
    await act(async () => {
      returned = await result.current.login('ana@example.com', 'correct horse');
    });

    expect(returned).toBe(session);
    expect(loginService).toHaveBeenCalledWith('ana@example.com', 'correct horse');
    expect(result.current).toMatchObject({ token: 'access-1', userId: 'u1', username: 'ana', isAuthenticated: true });
    // A previous account's cached progress never leaks into the new session.
    expect(invalidateChallengeProgressCache).toHaveBeenCalled();
  });

  it('falls back to what the service stored when the answer has no user', async () => {
    (loginService as jest.Mock).mockResolvedValue({ accessToken: 'access-1', user: {} });
    const result = await signedOut();
    (getUserId as jest.Mock).mockResolvedValue('u7');
    (getUsername as jest.Mock).mockResolvedValue('stored-name');

    await act(async () => {
      await result.current.login('ana@example.com', 'correct horse');
    });

    expect(result.current).toMatchObject({ token: 'access-1', userId: 'u7', username: 'stored-name', isAuthenticated: true });
  });

  it('stays signed out and rethrows when the credentials are wrong', async () => {
    const wrongPassword = Object.assign(new Error('401'), { response: { status: 401 } });
    (loginService as jest.Mock).mockRejectedValue(wrongPassword);
    const result = await signedOut();

    await act(async () => {
      await expect(result.current.login('ana@example.com', 'nope')).rejects.toBe(wrongPassword);
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('signs up with the legal consent and is signed in afterwards', async () => {
    (registerService as jest.Mock).mockResolvedValue(session);
    const result = await signedOut();

    await act(async () => {
      await result.current.register('ana@example.com', 'ana', 'correct horse', consent);
    });

    expect(registerService).toHaveBeenCalledWith('ana@example.com', 'ana', 'correct horse', consent);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.username).toBe('ana');
  });

  it('logs out: stops pushes first, then clears the session', async () => {
    (loginService as jest.Mock).mockResolvedValue(session);
    const result = await signedOut();
    await act(async () => {
      await result.current.login('ana@example.com', 'correct horse');
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(unregisterPushToken).toHaveBeenCalled();
    expect(logoutService).toHaveBeenCalledWith();
    const pushOrder = (unregisterPushToken as jest.Mock).mock.invocationCallOrder[0];
    const logoutOrder = (logoutService as jest.Mock).mock.invocationCallOrder[0];
    expect(pushOrder).toBeLessThan(logoutOrder);
    expect(result.current).toMatchObject({ token: null, userId: null, username: null, isAuthenticated: false });
  });
});
