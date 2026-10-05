import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { storage } from '../../utils/storage';
import { registerPushToken, removePushToken } from './notifications.service';

/** The Expo push token this install registered, so logout can remove exactly it. */
export const PUSH_TOKEN_KEY = 'pushToken';
/** The user closed the "turn on notifications" card: don't show it again. */
export const PUSH_PROMPT_DISMISSED_KEY = 'pushPromptDismissed';

const ANDROID_CHANNEL_ID = 'default';
const UNREGISTER_TIMEOUT_MS = 3000;

/**
 * - granted: pushes can be delivered.
 * - undetermined: never asked — the in-app card may offer to ask.
 * - denied: refused, but the OS still allows asking again.
 * - blocked: refused and the OS won't show the prompt anymore — only the
 *   system Settings can change it. Never call the prompt in this state.
 * - unsupported: web, or a simulator/emulator (no remote pushes there).
 */
export type PushPermissionState = 'granted' | 'undetermined' | 'denied' | 'blocked' | 'unsupported';

function isPushCapable(): boolean {
  return Platform.OS !== 'web' && Device.isDevice;
}

function toState(status: Notifications.NotificationPermissionsStatus): PushPermissionState {
  if (
    status.granted ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return 'granted';
  }
  if (status.status === Notifications.PermissionStatus.UNDETERMINED) return 'undetermined';
  return status.canAskAgain ? 'denied' : 'blocked';
}

let handlerConfigured = false;

/** Foreground behavior: show the banner/list entry and play the sound; the
 * app icon badge is managed from the unread count, not by each push. */
export function configureNotificationHandler(): void {
  if (handlerConfigured || Platform.OS === 'web') return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Android 8+ needs a channel (and Android 13 needs it before the prompt). */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Havit',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export async function getPushPermissionState(): Promise<PushPermissionState> {
  if (!isPushCapable()) return 'unsupported';
  try {
    return toState(await Notifications.getPermissionsAsync());
  } catch {
    return 'unsupported';
  }
}

/**
 * Asks the OS — only ever called from an explicit user tap (never on app
 * start), and never when the OS has stopped allowing the prompt, so there's
 * no way to loop. On success the token is registered right away.
 */
export async function requestPushPermission(): Promise<PushPermissionState> {
  const current = await getPushPermissionState();
  if (current === 'granted' || current === 'unsupported' || current === 'blocked') {
    if (current === 'granted') await syncPushToken();
    return current;
  }
  try {
    await ensureAndroidChannel();
    const next = toState(await Notifications.requestPermissionsAsync());
    if (next === 'granted') await syncPushToken();
    return next;
  } catch {
    return current;
  }
}

/** Where a blocked permission can still be turned on. */
export function openNotificationSettings(): Promise<void> {
  return Linking.openSettings();
}

function getProjectId(): string | undefined {
  const fromExtra = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)
    ?.eas?.projectId;
  return fromExtra ?? Constants.easConfig?.projectId ?? undefined;
}

/**
 * Gets this install's Expo push token and (re)registers it with the backend.
 * Silent no-op unless permission is already granted — it never prompts.
 * Returns null when push isn't available here: web, simulator, Expo Go on
 * Android (no remote push since SDK 53) or a build without an EAS projectId.
 */
export async function syncPushToken(): Promise<string | null> {
  if ((await getPushPermissionState()) !== 'granted') return null;
  const projectId = getProjectId();
  if (!projectId) {
    if (__DEV__) {
      console.warn('[push] no EAS projectId in app config — push token not registered');
    }
    return null;
  }
  try {
    await ensureAndroidChannel();
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerPushToken(token, Platform.OS === 'ios' ? 'ios' : 'android');
    await storage.setItem(PUSH_TOKEN_KEY, token);
    return token;
  } catch (error) {
    if (__DEV__) console.warn('[push] could not register the push token', error);
    return null;
  }
}

/**
 * Logout: removes this device's token from the account so it stops getting
 * that account's pushes. Bounded wait — logging out never hangs on it. If
 * the call can't be made (offline, session already expired) the token is
 * still forgotten locally; the backend moves it to whoever registers it next
 * and never pushes to inactive or pending-deletion accounts.
 */
export async function unregisterPushToken(): Promise<void> {
  const token = await storage.getItem(PUSH_TOKEN_KEY);
  if (!token) return;
  await storage.removeItem(PUSH_TOKEN_KEY);
  await Promise.race([
    removePushToken(token).catch(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, UNREGISTER_TIMEOUT_MS)),
  ]);
}

/** App icon badge (iOS / supported Android launchers). */
export async function setAppBadgeCount(count: number): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.setBadgeCountAsync(Math.max(0, count));
  } catch {
    // Not supported by this launcher.
  }
}
