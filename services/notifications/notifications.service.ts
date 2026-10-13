import api from '../api';
import type {
  NotificationContract,
  NotificationPreferenceContract,
  NotificationPreferenceUpdate,
  NotificationsPage,
} from '../../types/notification';

/**
 * One page of the inbox, newest first. Same cursor contract as B1's paginated
 * lists: the next page's cursor comes back in the X-Next-Cursor header (axios
 * lower-cases header names) and is sent back as `?cursor=`.
 */
export async function getNotifications(cursor?: string | null): Promise<NotificationsPage> {
  const response = await api.get<NotificationContract[]>('/notifications', {
    params: cursor ? { cursor } : undefined,
  });
  const next = response.headers?.['x-next-cursor'];
  return {
    notifications: Array.isArray(response.data) ? response.data : [],
    nextCursor: typeof next === 'string' && next.length > 0 ? next : null,
  };
}

/** Badge count. Background refresh — never worth a global error toast. */
export async function getUnreadNotificationsCount(): Promise<number> {
  const response = await api.get<{ count: number }>('/notifications/unread-count', {
    suppressErrorToast: true,
  });
  return response.data?.count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`, undefined, { suppressErrorToast: true });
}

export async function markAllNotificationsRead(): Promise<number> {
  const response = await api.patch<{ updated: number }>('/notifications/read-all');
  return response.data?.updated ?? 0;
}

export async function getNotificationPreferences(): Promise<NotificationPreferenceContract[]> {
  const response = await api.get<NotificationPreferenceContract[]>('/notifications/preferences');
  return Array.isArray(response.data) ? response.data : [];
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferenceUpdate[],
): Promise<NotificationPreferenceContract[]> {
  const response = await api.patch<NotificationPreferenceContract[]>(
    '/notifications/preferences',
    { preferences },
  );
  return Array.isArray(response.data) ? response.data : [];
}

/** Idempotent; also moves the token to this account if another one used the device. */
export async function registerPushToken(token: string, platform: 'ios' | 'android'): Promise<void> {
  await api.post('/notifications/push-tokens', { token, platform }, { suppressErrorToast: true });
}

/** Logout: best effort, the caller is leaving either way. */
export async function removePushToken(token: string): Promise<void> {
  await api.delete('/notifications/push-tokens', {
    data: { token },
    suppressErrorToast: true,
  });
}
