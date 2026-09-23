// `@expo/metro-runtime` MUST be first so Fast Refresh works with the custom
// Expo Router entrypoint.
import '@expo/metro-runtime';

import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

// React Native Skia uses CanvasKit/WASM on web. Expo Router otherwise mounts
// screens containing <Canvas> before global.CanvasKit exists, which crashes
// every Skia canvas with `PictureRecorder` undefined.
LoadSkiaWeb().then(() => {
  renderRootComponent(App);
});
