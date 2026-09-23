import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
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

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={handleLayout}>
      {size.width > 0 && size.height > 0 ? (
        <WebSafeCanvas style={StyleSheet.absoluteFill}>{children(size)}</WebSafeCanvas>
      ) : null}
    </View>
  );
}
