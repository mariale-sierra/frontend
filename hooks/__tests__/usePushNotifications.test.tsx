import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { usePushNotifications } from '../usePushNotifications';
import { useNotificationsStore } from '../../store/notificationsStore';
import {
  getUnreadNotificationsCount,
  markNotificationRead,
} from '../../services/notifications/notifications.service';
import { syncPushToken } from '../../services/notifications/pushNotifications';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

const listeners: {
  received?: () => void;
  response?: (r: unknown) => void;
  token?: () => void;
} = {};
jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  addNotificationReceivedListener: jest.fn((cb) => {
    listeners.received = cb;
    return { remove: jest.fn() };
  }),
  addNotificationResponseReceivedListener: jest.fn((cb) => {
    listeners.response = cb;
    return { remove: jest.fn() };
  }),
  addPushTokenListener: jest.fn((cb) => {
    listeners.token = cb;
    return { remove: jest.fn() };
  }),
  getLastNotificationResponse: jest.fn(() => null),
  clearLastNotificationResponse: jest.fn(),
}));
jest.mock('../../services/notifications/notifications.service', () => ({
  getUnreadNotificationsCount: jest.fn(() => Promise.resolve(3)),
  markNotificationRead: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../services/notifications/pushNotifications', () => ({
  configureNotificationHandler: jest.fn(),
  setAppBadgeCount: jest.fn(() => Promise.resolve()),
  syncPushToken: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('../../services/chats/chats.service', () => ({ getConversations: jest.fn() }));

const UUID = '3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b';

const tap = (data: Record<string, string>, action = 'expo.modules.notifications.actions.DEFAULT') => ({
  actionIdentifier: action,
  notification: { request: { content: { data } } },
});

describe('usePushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNotificationsStore.setState({ unreadCount: 0 });
    (Notifications.getLastNotificationResponse as jest.Mock).mockReturnValue(null);
  });

  it('refreshes the unread count and the token on sign-in, without prompting', async () => {
    await renderHook(() => usePushNotifications(true, true));
    await waitFor(() => expect(useNotificationsStore.getState().unreadCount).toBe(3));
    expect(syncPushToken).toHaveBeenCalled();
  });

  it('refreshes the badge when a push arrives while the app is open (foreground)', async () => {
    await renderHook(() => usePushNotifications(true, true));
    await waitFor(() => expect(getUnreadNotificationsCount).toHaveBeenCalledTimes(1));
    (getUnreadNotificationsCount as jest.Mock).mockResolvedValueOnce(4);

    await act(async () => listeners.received?.());

    await waitFor(() => expect(useNotificationsStore.getState().unreadCount).toBe(4));
  });

  it('opens the related screen and marks it read when a push is tapped (background)', async () => {
    await renderHook(() => usePushNotifications(true, true));

    await act(async () =>
      listeners.response?.(
        tap({ notificationId: '9', type: 'challenge_closed', entityType: 'challenge', entityId: UUID }),
      ),
    );

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(`/challenge/${UUID}`));
    expect(markNotificationRead).toHaveBeenCalledWith('9');
  });

  it('opens the inbox for a push with nothing specific to open', async () => {
    await renderHook(() => usePushNotifications(true, true));
    await act(async () =>
      listeners.response?.(tap({ type: 'report_resolved', entityType: 'content_report', entityId: '1' })),
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/notifications'));
  });

  it('ignores non-default actions (e.g. dismiss)', async () => {
    await renderHook(() => usePushNotifications(true, true));
    await act(async () => listeners.response?.(tap({ type: 'new_follower' }, 'dismiss')));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles the tap that cold-started the app once navigation is possible', async () => {
    (Notifications.getLastNotificationResponse as jest.Mock).mockReturnValue(
      tap({ type: 'new_follower', entityType: 'user', entityId: UUID, notificationId: '5' }),
    );

    const { rerender } = await renderHook(
      ({ canNavigate }: { canNavigate: boolean }) => usePushNotifications(true, canNavigate),
      { initialProps: { canNavigate: false } },
    );
    // Still on the splash/redirect: nothing yet.
    expect(mockPush).not.toHaveBeenCalled();
    expect(Notifications.clearLastNotificationResponse).toHaveBeenCalled();

    await act(async () => rerender({ canNavigate: true }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(`/profile/${UUID}`));
    expect(markNotificationRead).toHaveBeenCalledWith('5');
  });

  it('drops a pending tap and clears the badge when the user signs out', async () => {
    const { rerender } = await renderHook(
      ({ auth, canNavigate }: { auth: boolean; canNavigate: boolean }) =>
        usePushNotifications(auth, canNavigate),
      { initialProps: { auth: true, canNavigate: false } },
    );
    await act(async () =>
      listeners.response?.(tap({ type: 'new_follower', entityType: 'user', entityId: UUID })),
    );

    await act(async () => rerender({ auth: false, canNavigate: false }));
    await act(async () => rerender({ auth: false, canNavigate: true }));

    expect(mockPush).not.toHaveBeenCalled();
    expect(useNotificationsStore.getState().unreadCount).toBe(0);
  });

  it('re-registers the token when the OS rotates it', async () => {
    await renderHook(() => usePushNotifications(true, true));
    (syncPushToken as jest.Mock).mockClear();
    await act(async () => listeners.token?.());
    expect(syncPushToken).toHaveBeenCalledTimes(1);
  });
});
