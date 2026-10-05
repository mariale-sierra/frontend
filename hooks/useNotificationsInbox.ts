import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notifications/notifications.service';
import { useNotificationsStore } from '../store/notificationsStore';
import type { NotificationContract } from '../types/notification';

/**
 * Inbox state: first page on mount, more pages through the X-Next-Cursor
 * cursor (the backend's B1 pattern), pull-to-refresh, and read actions that
 * update the list and the shared unread badge right away.
 */
export function useNotificationsInbox() {
  const [notifications, setNotifications] = useState<NotificationContract[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const { refreshUnreadCount, decrementUnread, setUnreadCount } = useNotificationsStore();
  // Guards against a stale page landing after a refresh started over.
  const requestId = useRef(0);

  const loadFirstPage = useCallback(async () => {
    const id = ++requestId.current;
    setError(false);
    try {
      const page = await getNotifications();
      if (id !== requestId.current) return;
      setNotifications(page.notifications);
      setNextCursor(page.nextCursor);
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }, [loadFirstPage]);

  const reload = useCallback(() => {
    setLoading(true);
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore || loading) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const page = await getNotifications(nextCursor);
      if (id !== requestId.current) return;
      setNotifications((current) => {
        const seen = new Set(current.map((n) => n.id));
        return [...current, ...page.notifications.filter((n) => !seen.has(n.id))];
      });
      setNextCursor(page.nextCursor);
    } catch {
      // Keep what's loaded; reaching the end of the list again retries.
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, loading]);

  const markRead = useCallback(
    (notification: NotificationContract) => {
      if (notification.isRead) return;
      setNotifications((current) =>
        current.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
      );
      decrementUnread();
      markNotificationRead(notification.id).catch(() => {
        // The badge re-syncs from the server; the row stays read locally.
        void refreshUnreadCount();
      });
    },
    [decrementUnread, refreshUnreadCount],
  );

  const markAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // The shared API client already shows the error toast.
    } finally {
      setMarkingAll(false);
    }
  }, [setUnreadCount]);

  return {
    notifications,
    hasUnread: notifications.some((n) => !n.isRead),
    hasMore: nextCursor !== null,
    loading,
    refreshing,
    loadingMore,
    error,
    markingAll,
    refresh,
    reload,
    loadMore,
    markRead,
    markAllRead,
  };
}
