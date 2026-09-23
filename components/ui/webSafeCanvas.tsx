import { Canvas, type CanvasProps } from '@shopify/react-native-skia';
import { useCallback, useState } from 'react';
import { useIsFocused } from 'expo-router';
import { Platform, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

interface WebSafeCanvasProps extends CanvasProps {
  /**
   * Unmount the web canvas while its route is covered by another screen. React
   * Navigation can temporarily resize the old screen to 0x0 during a push;
   * Skia's web layout handler draws in that same frame and CanvasKit then
   * throws from drawImage. Native keeps its normal canvas lifecycle.
   */
  unmountOnBlur?: boolean;
}

/**
 * Skia's WebGL renderer keeps one live context per Canvas on web. Browsers
 * limit those contexts and can also return a null surface while a canvas is
 * being laid out, which otherwise bubbles up as a redbox from CanvasKit
 * (`rangeMin`/`MakeWebGLCanvasSurface`). Skia's static web renderer creates a
 * short-lived surface, catches an unavailable surface, and releases the
 * context after each draw. Native keeps the regular renderer unchanged. Web
 * also waits for a non-zero parent layout before mounting Canvas: an
 * absolute-fill canvas can otherwise be created during the first render with
 * a 0x0 OffscreenCanvas, which makes CanvasKit's `drawImage` throw before the
 * first real layout pass.
 */
export function WebSafeCanvas({ unmountOnBlur = false, ...props }: WebSafeCanvasProps) {
  if (Platform.OS === 'web' && unmountOnBlur) {
    return <FocusedWebSafeCanvas {...props} />;
  }

  return <MeasuredWebSafeCanvas {...props} />;
}

function FocusedWebSafeCanvas(props: CanvasProps) {
  const focused = useIsFocused();

  return focused ? (
    <MeasuredWebSafeCanvas {...props} />
  ) : (
    <View style={props.style} pointerEvents="none" />
  );
}

function MeasuredWebSafeCanvas({ __destroyWebGLContextAfterRender, ...props }: CanvasProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((previous) =>
      previous.width === width && previous.height === height ? previous : { width, height },
    );
  }, []);

  if (Platform.OS !== 'web') {
    return <Canvas {...props} __destroyWebGLContextAfterRender={__destroyWebGLContextAfterRender} />;
  }

  return (
    <View style={props.style} onLayout={handleLayout} pointerEvents="none">
      {size.width > 0 && size.height > 0 ? (
        <Canvas
          {...props}
          key={`${size.width}x${size.height}`}
          style={{ width: size.width, height: size.height }}
          __destroyWebGLContextAfterRender={true}
        />
      ) : null}
    </View>
  );
}
