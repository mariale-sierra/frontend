// Native AsyncStorage does not exist under Jest: any module that reaches utils/storage would
// otherwise fail to load. Tests that need specific stored values still mock utils/storage.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
