import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../authContext';
import { notifySessionExpired } from '../../services/auth/sessionEvents';
import { logout as logoutService } from '../../services/auth/auth.service';
import { forgetPushToken } from '../../services/notifications/pushNotifications';

jest.mock('../../services/auth/auth.service', () => ({
  fetchAuthMe: jest.fn(() => Promise.resolve({ sub: 'u1' })),
  getToken: jest.fn(() => Promise.resolve('stored-token')),
  getUserId: jest.fn(() => Promise.resolve('u1')),
  getUsername: jest.fn(() => Promise.resolve('ana')),
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

describe('AuthProvider — session expired', () => {
  it('signs the user out when the API reports the session is no longer valid', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      notifySessionExpired();
      await new Promise<void>((resolve) => setImmediate(() => resolve()));
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(logoutService).toHaveBeenCalled();
    // The token can't be removed server-side with a dead session: only locally.
    expect(forgetPushToken).toHaveBeenCalled();
  });
});
