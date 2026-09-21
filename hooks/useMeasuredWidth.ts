import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

/**
 * The width a view is laid out at, for a component that sizes its own parts from it:
 * `width` is 0 until the first layout pass, so it can hold off drawing until it knows.
 * Give `onLayout` to the view to measure.
 */
export function useMeasuredWidth() {
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width), []);

  return { width, onLayout };
}
