import { create } from 'zustand';
import { getUnreadNotificationsCount } from '../services/notifications/notifications.service';

/**
 * Unread notifications count — the one source for the Home bell dot and the
 * app icon badge. Refreshed on events, never polled: app start / return to
 * foreground, a push received while the app is open, and every read action
 * in the inbox (see hooks/usePushNotifications.ts and app/notifications.tsx).
 */
interface NotificationsStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  /** One notification read locally (optimistic, before the server answers). */
  decrementUnread: () => void;
  refreshUnreadCount: () => Promise<void>;
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  decrementUnread: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  refreshUnreadCount: async () => {
    try {
      const count = await getUnreadNotificationsCount();
      set({ unreadCount: Math.max(0, count) });
    } catch {
      // Keep the last known value; the next trigger refreshes it.
    }
  },
  reset: () => set({ unreadCount: 0 }),
}));
