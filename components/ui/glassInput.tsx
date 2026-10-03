import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Input } from './input';
import type { InputProps } from './input';
import { GlassBackdrop, glassBorderStyle } from './glassSurface';
import { colors, radius } from '../../constants/theme';
import { BOTTOM_NAV_BREATHE_SPRING } from '../../constants/bottomNav';
import { triggerLightHaptic } from '../../utils/haptics';
import { withAlpha } from '../../utils/color';

// How much the field grows, and how bright its rim gets, while it has focus.
const FOCUS_SCALE = 1.012;
const FOCUS_RING_OPACITY = 0.24;

type GlassInputProps = Omit<InputProps, 'backdrop' | 'variant'>;

// The focus / blur event types, taken from `TextInputProps` so they follow
// whatever React Native version is installed.
type FocusEvent = Parameters<NonNullable<InputProps['onFocus']>>[0];
type BlurEvent = Parameters<NonNullable<InputProps['onBlur']>>[0];

/**
 * A `big`-radius frosted-glass text field, same look as the bottom nav bar (the
 * shared `glass` recipe: blur, dark `surface` tint, hairline `paper` rim).
 * Focusing it gives a light haptic, a gentle spring grow (the nav bar's own
 * spring) and a brighter rim. It takes everything `Input` does — icons,
 * `multiline`, `maxLength`, ... — so it is the one place a glass field is built:
 * `SearchBar` and the chat / space message composers are all this with their own
 * icons and padding, passed through `containerStyle`.
 *
 * The blur only shows something when there's content behind the field, so on a
 * plain screen the glass reads as a frosted `surface` panel with a light rim.
 * Give it a transparent parent (not a solid `surface` bar) or it disappears.
 */
export function GlassInput({ containerStyle, onFocus, onBlur, ...props }: GlassInputProps) {
  const focus = useSharedValue(0);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + focus.value * (FOCUS_SCALE - 1) }],
  }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: focus.value }));

  const handleFocus = useCallback(
    (event: FocusEvent) => {
      focus.value = withSpring(1, BOTTOM_NAV_BREATHE_SPRING);
      triggerLightHaptic();
      onFocus?.(event);
    },
    [focus, onFocus],
  );

  const handleBlur = useCallback(
    (event: BlurEvent) => {
      focus.value = withSpring(0, BOTTOM_NAV_BREATHE_SPRING);
      onBlur?.(event);
    },
    [focus, onBlur],
  );

  return (
    <Animated.View style={scaleStyle}>
      <Input
        {...props}
        onFocus={handleFocus}
        onBlur={handleBlur}
        backdrop={
          <>
            <GlassBackdrop />
            <Animated.View pointerEvents="none" style={[styles.focusRing, ringStyle]} />
          </>
        }
        containerStyle={[styles.container, containerStyle]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.big,
    overflow: 'hidden',
    ...glassBorderStyle,
  },
  focusRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.big,
    borderWidth: 1,
    borderColor: withAlpha(colors.paper, FOCUS_RING_OPACITY),
  },
});
