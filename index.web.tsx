// `@expo/metro-runtime` MUST be first so Fast Refresh works with the custom
// Expo Router entrypoint.
import '@expo/metro-runtime';

import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';
import { colors } from './constants/theme';

// Havit is a phone app. On a wide window (a computer, even full screen) the web
// build shows itself inside a phone-sized frame instead of stretching across
// the screen: the page becomes just a centered iframe, at a phone's aspect
// ratio and the window's full height, loading this same URL. Inside that
// iframe the app runs exactly as on a phone — its window IS phone-sized, so
// everything that measures the screen (the tab bar, grids, sheets and popups,
// which on web render over the whole page) lays out like it does on a device.
// A narrow window (a phone's browser) and the iframe itself skip this and just
// run the app.
const PHONE_FRAME_MIN_WINDOW_WIDTH = 600;
// An iPhone 14/15 portrait screen (390 × 844), 8% wider on explicit request
// ("a bit narrow") — 390 × 1.08 ≈ 421.
const PHONE_ASPECT_RATIO = '421 / 844';

function shouldShowPhoneFrame() {
  if (typeof window === 'undefined') return false;
  const isTopWindow = window.self === window.top;
  return isTopWindow && window.innerWidth >= PHONE_FRAME_MIN_WINDOW_WIDTH;
}

function mountPhoneFrame() {
  const { body, documentElement } = document;
  documentElement.style.height = '100%';
  documentElement.style.background = colors.ink;
  Object.assign(body.style, {
    margin: '0',
    height: '100%',
    background: colors.ink,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  });
  // Expo's own mount point stays empty on this outer page.
  const root = document.getElementById('root');
  if (root) root.style.display = 'none';

  const frame = document.createElement('iframe');
  frame.src = window.location.href;
  frame.title = 'Havit';
  frame.setAttribute('allow', 'camera; microphone; clipboard-read; clipboard-write');
  Object.assign(frame.style, {
    height: '100%',
    aspectRatio: PHONE_ASPECT_RATIO,
    maxWidth: '100%',
    border: '0',
    display: 'block',
    background: colors.ink,
  });
  body.appendChild(frame);
}

// Skia on web draws each frame by copying an internal OffscreenCanvas onto
// the visible canvas. While a canvas is being laid out or resized (the phone
// frame mounting, a background remounting on a step change) that internal
// canvas can momentarily be 0×0, and the browser THROWS on drawing a 0-sized
// image ("Failed to execute 'drawImage'... width or height of 0") instead of
// just drawing nothing — an uncaught error over the whole app. Copying an
// empty image draws nothing anyway, so skip exactly that case; every real
// draw goes through untouched. Web only (this file never runs on native).
function guardZeroSizedDrawImage() {
  if (typeof CanvasRenderingContext2D === 'undefined') return;
  const proto = CanvasRenderingContext2D.prototype as CanvasRenderingContext2D & { __havitGuarded?: boolean };
  if (proto.__havitGuarded) return;
  const drawImage = proto.drawImage;
  proto.drawImage = function guardedDrawImage(this: CanvasRenderingContext2D, ...args: unknown[]) {
    const image = args[0] as { width?: number; height?: number } | undefined;
    if (image && (image.width === 0 || image.height === 0)) return;
    return (drawImage as (...params: unknown[]) => void).apply(this, args);
  } as typeof proto.drawImage;
  proto.__havitGuarded = true;
}

if (shouldShowPhoneFrame()) {
  mountPhoneFrame();
} else {
  guardZeroSizedDrawImage();
  // React Native Skia uses CanvasKit/WASM on web. Expo Router otherwise mounts
  // screens containing <Canvas> before global.CanvasKit exists, which crashes
  // every Skia canvas with `PictureRecorder` undefined.
  LoadSkiaWeb().then(() => {
    renderRootComponent(App);
  });
}
