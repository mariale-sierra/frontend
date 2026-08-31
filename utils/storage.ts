import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const storage = {
  getItem(key: string) {
    return AsyncStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    return AsyncStorage.setItem(key, value);
  },
  removeItem(key: string) {
    return AsyncStorage.removeItem(key);
  },
};

/**
 * Sensitive values (currently: the JWT access token) go through the OS keychain/keystore
 * via expo-secure-store instead of AsyncStorage's plain-text storage. Non-sensitive session
 * data (userId, username) stays on `storage` above — no need for keychain overhead there.
 *
 * expo-secure-store has no web implementation — `getItemAsync`/etc. throw
 * "... is not a function" there (there's no native module for the browser
 * to bind to), which was taking down auth restoration on every page load.
 * Fall back to AsyncStorage on web: less secure than the OS keychain, but
 * it's the standard workaround for this exact expo-secure-store limitation,
 * and strictly better than a hard failure on launch.
 */
export const secureStorage = {
  getItem(key: string) {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem(key: string, value: string) {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  removeItem(key: string) {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};
