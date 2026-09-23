import { Canvas, type CanvasProps } from '@shopify/react-native-skia';
import { Platform } from 'react-native';

/**
 * Skia's WebGL renderer keeps one live context per Canvas on web. Browsers
 * limit those contexts and can also return a null surface while a canvas is
 * being laid out, which otherwise bubbles up as a redbox from CanvasKit
 * (`rangeMin`/`MakeWebGLCanvasSurface`). Skia's static web renderer creates a
 * short-lived surface, catches an unavailable surface, and releases the
 * context after each draw. Native keeps the regular renderer unchanged.
 */
export function WebSafeCanvas({ __destroyWebGLContextAfterRender, ...props }: CanvasProps) {
  return (
    <Canvas
      {...props}
      __destroyWebGLContextAfterRender={
        Platform.OS === 'web' ? true : __destroyWebGLContextAfterRender
      }
    />
  );
}
