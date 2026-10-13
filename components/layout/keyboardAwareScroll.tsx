import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';
import type { KeyboardEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollViewProps } from 'react-native';

/** Breathing room kept between the field being typed in and the top of the keyboard. */
const FIELD_MARGIN = 24;

/**
 * A ScrollView for forms that keeps the field you are typing in visible: when the keyboard
 * opens it makes room at the bottom and scrolls just enough to lift the focused field above the
 * keyboard. It works whether or not the system already resizes the window for the keyboard (on
 * Android's edge-to-edge screens it often does not, and the keyboard used to cover the field):
 * if the field is already clear of the keyboard it does nothing. Use it in place of `ScrollView`.
 */
export function KeyboardAwareScroll({ contentContainerStyle, onScroll, children, ...props }: ScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const offsetY = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
      const keyboardTop = event.endCoordinates.screenY;
      // Let the padding below land first, then lift the focused field into view.
      setTimeout(() => {
        const focused = TextInput.State.currentlyFocusedInput?.();
        focused?.measureInWindow((_x, y, _width, height) => {
          const overlap = y + height + FIELD_MARGIN - keyboardTop;
          if (overlap > 0) scrollRef.current?.scrollTo({ y: offsetY.current + overlap, animated: true });
        });
      }, 60);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offsetY.current = event.nativeEvent.contentOffset.y;
      onScroll?.(event);
    },
    [onScroll],
  );

  // The screen's own bottom padding stays; the keyboard's height is added on top of it.
  const basePadding = Number(StyleSheet.flatten(contentContainerStyle)?.paddingBottom ?? 0);

  return (
    <ScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      {...props}
      onScroll={handleScroll}
      contentContainerStyle={[contentContainerStyle, keyboardHeight > 0 && { paddingBottom: basePadding + keyboardHeight }]}
    >
      {children}
    </ScrollView>
  );
}
