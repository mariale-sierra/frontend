import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { WebSafeCanvas } from './webSafeCanvas';

interface AccentGlowProps {
  /** Draws the glow (Skia nodes, e.g. `AccentDome` or `AccentMesh`) at the size
   * that was measured. */
  children: (size: { width: number; height: number }) => ReactNode;
}

/**
 * A Skia canvas laid over its parent at the parent's own measured size — the host
 * for a card's glow. It ignores touches, and waits for the first layout before
 * drawing (one frame). The parent should clip it to its corners (`overflow:
 * 'hidden'` + radius) and draw its content after it.
 */
export function AccentGlow({ children }: AccentGlowProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((previous) => (previous.width === width && previous.height === height ? previous : { width, height }));
  }, []);

  // CanvasKit's web renderer can still receive a stale layout callback while a
  // card is mounting/resizing. This glow is decorative: the card's surface,
  // outline, content and interactions remain fully native/web-safe without it.
  // Keep the Skia glow on iOS/Android, where its renderer is stable, and use the
  // card's existing flat surface as the web fallback instead of allowing a
  // zero-sized OffscreenCanvas to crash the route.
  if (Platform.OS === 'web') {
    return <View style={StyleSheet.absoluteFill} pointerEvents="none" />;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={handleLayout}>
      {size.width > 0 && size.height > 0 ? (
        <WebSafeCanvas style={StyleSheet.absoluteFill}>{children(size)}</WebSafeCanvas>
      ) : null}
    </View>
  );
}
