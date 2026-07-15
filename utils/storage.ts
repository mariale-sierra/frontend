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
 */
export const secureStorage = {
  getItem(key: string) {
    return SecureStore.getItemAsync(key);
  },
  setItem(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem(key: string) {
    return SecureStore.deleteItemAsync(key);
  },
};
