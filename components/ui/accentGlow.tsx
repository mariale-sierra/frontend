import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ComponentProps } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import { AccentDome } from './accentDome';

type AccentGlowProps = Omit<ComponentProps<typeof AccentDome>, 'width' | 'height'>;

/**
 * `AccentDome` drawn to fill its parent, at the parent's own measured size: a
 * Skia canvas laid over a card (or any box) as its glow. It ignores touches,
 * and waits for the first layout before drawing (one frame). The parent should
 * clip it to its corners (`overflow: 'hidden'` + radius) and draw its content
 * after it.
 */
export function AccentGlow(props: AccentGlowProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((previous) => (previous.width === width && previous.height === height ? previous : { width, height }));
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={handleLayout}>
      {size.width > 0 && size.height > 0 ? (
        <Canvas style={StyleSheet.absoluteFill}>
          <AccentDome {...props} width={size.width} height={size.height} />
        </Canvas>
      ) : null}
    </View>
  );
}
