import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { storage } from '../../../utils/storage';
import { registerPushToken, removePushToken } from '../notifications.service';
import {
  getPushPermissionState,
  openNotificationSettings,
  PUSH_TOKEN_KEY,
  requestPushPermission,
  syncPushToken,
  unregisterPushToken,
} from '../pushNotifications';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  setBadgeCountAsync: jest.fn(() => Promise.resolve(true)),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { HIGH: 4 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  PermissionStatus: { UNDETERMINED: 'undetermined', GRANTED: 'granted', DENIED: 'denied' },
}));
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'project-123' } } } },
}));
jest.mock('../../../utils/storage', () => ({
  storage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('../notifications.service', () => ({
  registerPushToken: jest.fn(() => Promise.resolve()),
  removePushToken: jest.fn(() => Promise.resolve()),
}));

const permission = (status: string, canAskAgain = true, granted = status === 'granted') => ({
  status,
  granted,
  canAskAgain,
  expires: 'never',
});

describe('push notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Device as { isDevice: boolean }).isDevice = true;
    Platform.OS = 'ios';
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: 'ExponentPushToken[abc]',
    });
  });

  describe('permission state', () => {
    it.each([
      [permission('granted'), 'granted'],
      [permission('undetermined'), 'undetermined'],
      [permission('denied', true), 'denied'],
      [permission('denied', false), 'blocked'],
    ])('maps %o to %s', async (status, expected) => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue(status);
      expect(await getPushPermissionState()).toBe(expected);
    });

    it('is unsupported on a simulator', async () => {
      (Device as { isDevice: boolean }).isDevice = false;
      expect(await getPushPermissionState()).toBe('unsupported');
      expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    });
  });

  describe('asking', () => {
    it('never shows the OS prompt once it is blocked (no loops)', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue(
        permission('denied', false),
      );
      expect(await requestPushPermission()).toBe('blocked');
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('asks once and registers the token when the user accepts', async () => {
      (Notifications.getPermissionsAsync as jest.Mock)
        .mockResolvedValueOnce(permission('undetermined'))
        .mockResolvedValue(permission('granted'));
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue(
        permission('granted'),
      );

      expect(await requestPushPermission()).toBe('granted');
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
      expect(registerPushToken).toHaveBeenCalledWith('ExponentPushToken[abc]', 'ios');
    });

    it('reports a refusal without registering anything', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue(
        permission('undetermined'),
      );
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue(
        permission('denied', false),
      );
      expect(await requestPushPermission()).toBe('blocked');
      expect(registerPushToken).not.toHaveBeenCalled();
    });

    it('sends a blocked user to the system settings', async () => {
      const spy = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
      await openNotificationSettings();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('token', () => {
    it('registers the Expo token with its platform and remembers it for logout', async () => {
      Platform.OS = 'android';
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue(permission('granted'));

      expect(await syncPushToken()).toBe('ExponentPushToken[abc]');
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project-123' });
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalled();
      expect(registerPushToken).toHaveBeenCalledWith('ExponentPushToken[abc]', 'android');
      expect(storage.setItem).toHaveBeenCalledWith(PUSH_TOKEN_KEY, 'ExponentPushToken[abc]');
    });

    it('never prompts and registers nothing without permission', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue(
        permission('undetermined'),
      );
      expect(await syncPushToken()).toBeNull();
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
      expect(registerPushToken).not.toHaveBeenCalled();
    });

    it('fails soft when the token cannot be obtained (Expo Go, no network)', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue(permission('granted'));
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValue(new Error('no'));
      await expect(syncPushToken()).resolves.toBeNull();
    });

    it('removes the stored token from the account on logout', async () => {
      (storage.getItem as jest.Mock).mockResolvedValue('ExponentPushToken[abc]');
      await unregisterPushToken();
      expect(storage.removeItem).toHaveBeenCalledWith(PUSH_TOKEN_KEY);
      expect(removePushToken).toHaveBeenCalledWith('ExponentPushToken[abc]');
    });

    it('lets logout continue when removing the token fails or hangs', async () => {
      jest.useFakeTimers();
      (storage.getItem as jest.Mock).mockResolvedValue('ExponentPushToken[abc]');
      (removePushToken as jest.Mock).mockReturnValue(new Promise(() => undefined));
      const done = unregisterPushToken();
      await Promise.resolve();
      await Promise.resolve();
      jest.advanceTimersByTime(3000);
      await expect(done).resolves.toBeUndefined();
      jest.useRealTimers();
    });

    it('does nothing on logout when this device never registered', async () => {
      (storage.getItem as jest.Mock).mockResolvedValue(null);
      await unregisterPushToken();
      expect(removePushToken).not.toHaveBeenCalled();
    });
  });
});
