// Only needed so `jest-expo` can transform files at all. Outside of Jest,
// this resolves to exactly what Expo already does by default
// (`expo/internal/babel-preset` -> `babel-preset-expo` with no options), so
// `expo start`/EAS builds are unaffected.
//
// Under Jest, `react-native-reanimated`'s babel plugin is disabled: this repo
// has `react-native-reanimated` as a dependency but is missing its peer
// package `react-native-worklets` (pre-existing gap, not introduced by the
// test suite), which the reanimated plugin requires unconditionally. None of
// the current tests render reanimated-driven components, so this only avoids
// a transform-time crash — it does not change what Metro ships to the app.
// See https://docs.expo.dev/guides/testing-with-jest/ ("react-native-reanimated").
module.exports = function (api) {
  // `api.env()` already configures Babel's cache (keyed by env name) — do
  // not also call `api.cache(true)`, Babel forbids calling both.
  const isTest = api.env('test');

  // `babel-preset-expo` isn't hoisted to the project root's node_modules
  // (it lives nested under `node_modules/expo/node_modules/`) — resolve it
  // via `expo/internal/babel-preset`, the same indirection jest-expo itself
  // uses when no babel.config.js is present, so behavior stays identical.
  const expoPreset = require.resolve('expo/internal/babel-preset');

  return {
    presets: [[expoPreset, isTest ? { reanimated: false } : {}]],
  };
};
