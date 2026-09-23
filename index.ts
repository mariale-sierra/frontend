// `@expo/metro-runtime` MUST be first so Fast Refresh works with the custom
// Expo Router entrypoint.
import '@expo/metro-runtime';

import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

// Native platforms already provide Skia through the Expo native runtime. The
// web-specific entrypoint loads CanvasKit before registering this same router
// root; keeping the registration here preserves the native simulator flow.
renderRootComponent(App);
