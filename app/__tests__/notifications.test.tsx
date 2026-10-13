import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import Notifications from '../notifications';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notifications/notifications.service';
import { useNotificationsStore } from '../../store/notificationsStore';
import { usePushPermission } from '../../hooks/usePushPermission';
import { useInvites } from '../../hooks/useInvites';
import type { NotificationContract } from '../../types/notification';
import i18n from '../../i18n';

// Language-agnostic: the test environment's resolved language decides the copy.
const tr = (key: string, options?: Record<string, unknown>) => i18n.t(key, options) as string;
const followed = (name: string) => tr('notifications.types.new_follower', { name });

const mockPush = jest.fn();
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), canGoBack: () => true }),
  useIsFocused: () => true,
  router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../../services/notifications/notifications.service', () => ({
  getNotifications: jest.fn(),
  getUnreadNotificationsCount: jest.fn(),
  markNotificationRead: jest.fn(),
  markAllNotificationsRead: jest.fn(),
}));
jest.mock('../../services/chats/chats.service', () => ({ getConversations: jest.fn() }));
jest.mock('../../hooks/usePushPermission', () => ({ usePushPermission: jest.fn() }));
// Pending challenge invites (B5: the Invitations screen merged into this one).
jest.mock('../../hooks/useInvites', () => ({ useInvites: jest.fn() }));

const USER = '3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b';

const row = (overrides: Partial<NotificationContract> = {}): NotificationContract => ({
  id: '1',
  type: 'new_follower',
  category: 'social',
  isRead: false,
  createdAt: new Date().toISOString(),
  actor: { id: USER, username: 'bob', displayName: 'Bob', profileImageUrl: null },
  entity: { type: 'user', id: USER },
  data: {},
  title: null,
  body: null,
  ...overrides,
});

const invitesState = (overrides = {}) => ({
  received: [],
  sent: [],
  loading: false,
  refreshing: false,
  error: false,
  processingId: null,
  refresh: jest.fn(),
  reload: jest.fn(),
  runAction: jest.fn().mockResolvedValue(true),
  ...overrides,
});

const invite = (id: string, status = 'pending') => ({
  id,
  status,
  created_at: new Date().toISOString(),
  challenge: { id: 'ch-1', name: 'Reto de Fuerza' },
  sender: { id: 'u-ana', username: 'ana' },
  recipient: { id: 'u-bob', username: 'bob' },
});

const pushPermission = (overrides = {}) => ({
  state: 'granted',
  showCard: false,
  requesting: false,
  enable: jest.fn(),
  dismiss: jest.fn(),
  openSettings: jest.fn(),
  ...overrides,
});

describe('Notifications inbox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNotificationsStore.setState({ unreadCount: 0 });
    (getUnreadNotificationsCount as jest.Mock).mockResolvedValue(1);
    (markNotificationRead as jest.Mock).mockResolvedValue(undefined);
    (usePushPermission as jest.Mock).mockReturnValue(pushPermission());
    (useInvites as jest.Mock).mockReturnValue(invitesState());
  });

  describe('pending invites section (B5)', () => {
    beforeEach(() => {
      (getNotifications as jest.Mock).mockResolvedValue({ notifications: [], nextCursor: null });
    });

    it('is hidden when there are no pending invites', async () => {
      await renderWithProviders(<Notifications />);
      await waitFor(() => expect(screen.queryByTestId('notifications-invites')).toBeNull());
    });

    it('lists received invites to accept/decline and sent ones to cancel — answered ones are left out', async () => {
      (useInvites as jest.Mock).mockReturnValue(
        invitesState({ received: [invite('r-1'), invite('r-old', 'accepted')], sent: [invite('s-1')] }),
      );
      await renderWithProviders(<Notifications />);

      await waitFor(() => expect(screen.getByTestId('notifications-invites')).toBeTruthy());
      expect(screen.getByTestId('invite-accept-r-1')).toBeTruthy();
      expect(screen.getByTestId('invite-decline-r-1')).toBeTruthy();
      expect(screen.getByTestId('invite-cancel-s-1')).toBeTruthy();
      expect(screen.queryByTestId('invite-row-r-old')).toBeNull();
    });

    it('accepting runs the action and confirms it', async () => {
      const runAction = jest.fn().mockResolvedValue(true);
      (useInvites as jest.Mock).mockReturnValue(invitesState({ received: [invite('r-1')], runAction }));
      await renderWithProviders(<Notifications />);

      await waitFor(() => expect(screen.getByTestId('invite-accept-r-1')).toBeTruthy());
      await fireEvent.press(screen.getByTestId('invite-accept-r-1'));

      expect(runAction).toHaveBeenCalledWith('accept', 'r-1');
    });
  });

  it('lists notifications with the actor and marks unread ones', async () => {
    (getNotifications as jest.Mock).mockResolvedValue({
      notifications: [
        row(),
        row({ id: '2', isRead: true, type: 'challenge_closed', actor: null, category: 'challenges', entity: { type: 'challenge', id: USER } }),
      ],
      nextCursor: null,
    });

    await renderWithProviders(<Notifications />);

    expect(await screen.findByText(followed('Bob'))).toBeTruthy();
    expect(screen.getByText(tr('notifications.types.challenge_closed'))).toBeTruthy();
    expect(screen.getByLabelText(`${tr('notifications.unread')}. ${followed('Bob')}`)).toBeTruthy();
    expect(screen.getByLabelText(tr('notifications.types.challenge_closed'))).toBeTruthy();
  });

  it('shows the deleted-user label when the actor account is gone', async () => {
    (getNotifications as jest.Mock).mockResolvedValue({
      notifications: [row({ actor: null })],
      nextCursor: null,
    });
    await renderWithProviders(<Notifications />);
    expect(await screen.findByText(followed(tr('notifications.deletedUser')))).toBeTruthy();
  });

  it('shows the empty state', async () => {
    (getNotifications as jest.Mock).mockResolvedValue({ notifications: [], nextCursor: null });
    await renderWithProviders(<Notifications />);
    expect(await screen.findByText(tr('notifications.emptyTitle'))).toBeTruthy();
  });

  it('shows an error with a retry', async () => {
    (getNotifications as jest.Mock)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ notifications: [row()], nextCursor: null });

    await renderWithProviders(<Notifications />);
    fireEvent.press(await screen.findByText(tr('notifications.retry')));

    expect(await screen.findByText(followed('Bob'))).toBeTruthy();
  });

  it('marks a notification read and opens its screen when tapped', async () => {
    useNotificationsStore.setState({ unreadCount: 1 });
    (getNotifications as jest.Mock).mockResolvedValue({ notifications: [row()], nextCursor: null });
    (getUnreadNotificationsCount as jest.Mock).mockResolvedValue(1);

    await renderWithProviders(<Notifications />);
    await waitFor(() => expect(useNotificationsStore.getState().unreadCount).toBe(1));
    fireEvent.press(await screen.findByText(followed('Bob')));

    expect(markNotificationRead).toHaveBeenCalledWith('1');
    expect(mockPush).toHaveBeenCalledWith(`/profile/${USER}`);
    expect(useNotificationsStore.getState().unreadCount).toBe(0);
    expect(await screen.findByLabelText(followed('Bob'))).toBeTruthy();
  });

  it('marks everything as read and clears the badge', async () => {
    useNotificationsStore.setState({ unreadCount: 2 });
    (getNotifications as jest.Mock).mockResolvedValue({
      notifications: [row(), row({ id: '2' })],
      nextCursor: null,
    });
    (getUnreadNotificationsCount as jest.Mock).mockResolvedValue(2);
    (markAllNotificationsRead as jest.Mock).mockResolvedValue(2);

    await renderWithProviders(<Notifications />);
    fireEvent.press(await screen.findByLabelText(tr('notifications.markAllReadA11y')));

    await waitFor(() => expect(useNotificationsStore.getState().unreadCount).toBe(0));
    expect(markAllNotificationsRead).toHaveBeenCalled();
    expect(screen.queryByLabelText(new RegExp(`^${tr('notifications.unread')}`))).toBeNull();
  });

  it('loads the next page with the cursor when reaching the end', async () => {
    (getNotifications as jest.Mock)
      .mockResolvedValueOnce({ notifications: [row()], nextCursor: 'cursor-2' })
      .mockResolvedValueOnce({
        notifications: [row({ id: '2', type: 'post_reaction', entity: { type: 'workout_post', id: 'p' } })],
        nextCursor: null,
      });

    await renderWithProviders(<Notifications />);
    await screen.findByText(followed('Bob'));

    await act(async () => {
      fireEvent(screen.getByTestId('notifications-list'), 'endReached');
    });

    expect(getNotifications).toHaveBeenLastCalledWith('cursor-2');
    expect(await screen.findByText(tr('notifications.types.post_reaction', { name: 'Bob' }))).toBeTruthy();
  });

  it('asks for push permission only from the card the user taps', async () => {
    const permission = pushPermission({ state: 'undetermined', showCard: true });
    (usePushPermission as jest.Mock).mockReturnValue(permission);
    (getNotifications as jest.Mock).mockResolvedValue({ notifications: [], nextCursor: null });

    await renderWithProviders(<Notifications />);
    expect(permission.enable).not.toHaveBeenCalled();
    fireEvent.press(await screen.findByText(tr('notifications.push.enable')));
    expect(permission.enable).toHaveBeenCalledTimes(1);
  });

  it('offers the system settings instead of the prompt when push is blocked', async () => {
    const permission = pushPermission({ state: 'blocked', showCard: true });
    (usePushPermission as jest.Mock).mockReturnValue(permission);
    (getNotifications as jest.Mock).mockResolvedValue({ notifications: [], nextCursor: null });

    await renderWithProviders(<Notifications />);
    fireEvent.press(await screen.findByText(tr('notifications.push.openSettings')));
    expect(permission.openSettings).toHaveBeenCalled();
    expect(permission.enable).not.toHaveBeenCalled();
  });
});
