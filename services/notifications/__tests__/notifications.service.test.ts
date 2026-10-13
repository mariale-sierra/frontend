import api from '../../api';
import {
  getNotificationPreferences,
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
  registerPushToken,
  removePushToken,
  updateNotificationPreferences,
} from '../notifications.service';

jest.mock('../../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

describe('notifications service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads a page and the next cursor from the X-Next-Cursor header', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: [{ id: '3' }],
      headers: { 'x-next-cursor': 'abc' },
    });

    const page = await getNotifications();

    expect(api.get).toHaveBeenCalledWith('/notifications', { params: undefined });
    expect(page).toEqual({ notifications: [{ id: '3' }], nextCursor: 'abc' });
  });

  it('sends the cursor back as ?cursor= and reports the last page', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [], headers: {} });

    const page = await getNotifications('abc');

    expect(api.get).toHaveBeenCalledWith('/notifications', { params: { cursor: 'abc' } });
    expect(page.nextCursor).toBeNull();
  });

  it('reads the unread count without a global error toast', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { count: 4 } });
    expect(await getUnreadNotificationsCount()).toBe(4);
    expect(api.get).toHaveBeenCalledWith('/notifications/unread-count', {
      suppressErrorToast: true,
    });
  });

  it('marks one and all as read', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ data: { updated: 2 } });
    await markNotificationRead('7');
    expect(api.patch).toHaveBeenCalledWith('/notifications/7/read', undefined, {
      suppressErrorToast: true,
    });
    expect(await markAllNotificationsRead()).toBe(2);
    expect(api.patch).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('reads and updates preferences', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [{ category: 'social' }] });
    (api.patch as jest.Mock).mockResolvedValue({ data: [{ category: 'social' }] });

    await getNotificationPreferences();
    await updateNotificationPreferences([{ category: 'social', pushEnabled: false }]);

    expect(api.get).toHaveBeenCalledWith('/notifications/preferences');
    expect(api.patch).toHaveBeenCalledWith('/notifications/preferences', {
      preferences: [{ category: 'social', pushEnabled: false }],
    });
  });

  it('registers and removes push tokens quietly', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: {} });
    (api.delete as jest.Mock).mockResolvedValue({ data: {} });

    await registerPushToken('ExponentPushToken[a]', 'ios');
    await removePushToken('ExponentPushToken[a]');

    expect(api.post).toHaveBeenCalledWith(
      '/notifications/push-tokens',
      { token: 'ExponentPushToken[a]', platform: 'ios' },
      { suppressErrorToast: true },
    );
    expect(api.delete).toHaveBeenCalledWith('/notifications/push-tokens', {
      data: { token: 'ExponentPushToken[a]' },
      suppressErrorToast: true,
    });
  });
});
