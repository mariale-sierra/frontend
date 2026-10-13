import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useNotificationsStore } from '../store/notificationsStore';
import { markNotificationRead } from '../services/notifications/notifications.service';
import {
  configureNotificationHandler,
  setAppBadgeCount,
  syncPushToken,
} from '../services/notifications/pushNotifications';
import {
  openNotificationTarget,
  resolveNotificationTarget,
  type NotificationTarget,
} from '../services/notifications/notificationRoutes';
import type { PushNotificationData } from '../types/notification';

interface PendingOpen {
  target: NotificationTarget;
  notificationId?: string;
}

function toPendingOpen(response: Notifications.NotificationResponse): PendingOpen | null {
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return null;
  const data = (response.notification.request.content.data ?? {}) as PushNotificationData;
  const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
  return {
    notificationId: str(data.notificationId),
    target: resolveNotificationTarget({
      type: str(data.type),
      entityType: str(data.entityType),
      entityId: str(data.entityId),
      data,
    }),
  };
}

/**
 * Wires push notifications for the signed-in session (mounted once, in
 * app/_layout.tsx):
 *  - unread count: refreshed on sign-in, when the app returns to the
 *    foreground and when a push arrives while it's open — no polling;
 *  - token: re-registered on sign-in and whenever the OS rotates it, only
 *    if permission was already granted (asking happens in the inbox, from
 *    a user tap — never here);
 *  - taps: foreground/background via the response listener, cold start via
 *    the last response. The navigation waits for `canNavigate` (signed in,
 *    past login/terms/onboarding) so a cold-start redirect can't swallow it.
 */
export function usePushNotifications(isAuthenticated: boolean, canNavigate: boolean) {
  const router = useRouter();
  const refreshUnreadCount = useNotificationsStore((s) => s.refreshUnreadCount);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const resetUnread = useNotificationsStore((s) => s.reset);
  const [pending, setPending] = useState<PendingOpen | null>(null);
  const coldStartHandled = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // A tap meant for the previous session must not open anything for the next one.
      setPending(null);
      resetUnread();
      return;
    }

    void refreshUnreadCount();
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshUnreadCount();
    });
    if (Platform.OS === 'web') return () => appStateSub.remove();

    configureNotificationHandler();
    void syncPushToken();

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      void refreshUnreadCount();
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const open = toPendingOpen(response);
      if (open) setPending(open);
    });
    const tokenSub = Notifications.addPushTokenListener(() => {
      void syncPushToken();
    });

    if (!coldStartHandled.current) {
      coldStartHandled.current = true;
      const last = Notifications.getLastNotificationResponse();
      if (last) {
        Notifications.clearLastNotificationResponse();
        const open = toPendingOpen(last);
        if (open) setPending(open);
      }
    }

    return () => {
      appStateSub.remove();
      receivedSub.remove();
      responseSub.remove();
      tokenSub.remove();
    };
  }, [isAuthenticated, refreshUnreadCount, resetUnread]);

  useEffect(() => {
    if (!pending || !canNavigate) return;
    setPending(null);
    if (pending.notificationId) {
      markNotificationRead(pending.notificationId)
        .catch(() => undefined)
        .finally(() => void refreshUnreadCount());
    }
    void openNotificationTarget(router, pending.target).then((opened) => {
      // Nothing specific to open (e.g. a moderation result): show the inbox.
      if (!opened) router.push('/notifications');
    });
  }, [pending, canNavigate, router, refreshUnreadCount]);

  useEffect(() => {
    void setAppBadgeCount(isAuthenticated ? unreadCount : 0);
  }, [isAuthenticated, unreadCount]);
}
