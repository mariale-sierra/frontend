import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';
import { colors, radius, spacing, textOpacity, typography } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface FloatingLabelInputProps extends Omit<TextInputProps, 'placeholder' | 'style'> {
  /** Doubles as the placeholder when the field is empty and unfocused — see
   * this component's own doc comment for the floating behavior. */
  label: string;
  /** Tints the border `colors.error` instead of the usual focus treatment. */
  error?: boolean;
}

const HEIGHT = 64;
const ANIM_MS = 180;
const LABEL_REST_TOP = 21;
const LABEL_FLOAT_TOP = 10;
const REST_RISE = 4;
const FLOAT_SETTLE = 4;

/**
 * Single-pill text field with an animated floating label — replaces the
 * "card wrapping an already-pill-shaped input" (double-pill) look the
 * register wizard used at first, per explicit "I don't like the double pill
 * inputs, it should only be one... and I'd like for the labels to also have
 * animations" request. Standard Material-style behavior: the label sits
 * centered inside the pill like a placeholder at rest, and floats up into a
 * small caption near the top — driven by focus OR a non-empty value, so it
 * stays floated once there's real content even after blurring — the real
 * `TextInput` underneath it never needs a placeholder of its own.
 *
 * TWO separately-positioned `Text` elements (a "resting" one at the normal
 * size, a "floated" one already at its own smaller size), cross-fading
 * opacity — not one `Text` animated with `scale` (tried first). `scale`
 * anchors from the element's CENTER by default with no per-axis
 * transform-origin control in this RN version, so a short label visibly
 * drifted sideways as it shrank — real bug, per explicit "the label isn't
 * aligned with the input" report. Two statically-sized, independently
 * left-anchored labels (same `left: spacing.lg` on both) can't drift
 * relative to each other or to the input below them; only their opacity (and
 * a small settling `translateY`, both native-driver-safe) is animated.
 */
export function FloatingLabelInput({
  label,
  value,
  error = false,
  onFocus,
  onBlur,
  ...props
}: FloatingLabelInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const floated = focused || Boolean(value);
  const anim = useRef(new Animated.Value(floated ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: floated ? 1 : 0,
      duration: ANIM_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [floated, anim]);

  const restOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const restTranslateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -REST_RISE] });
  const floatOpacity = anim;
  const floatTranslateY = anim.interpolate({ inputRange: [0, 1], outputRange: [FLOAT_SETTLE, 0] });

  return (
    <Pressable
      style={[styles.container, focused && styles.containerFocused, error && styles.containerError]}
      onPress={() => inputRef.current?.focus()}
    >
      <Animated.Text
        style={[styles.labelRest, { opacity: restOpacity, transform: [{ translateY: restTranslateY }] }]}
        numberOfLines={1}
        pointerEvents="none"
      >
        {label}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.labelFloat,
          focused && styles.labelFloatFocused,
          { opacity: floatOpacity, transform: [{ translateY: floatTranslateY }] },
        ]}
        numberOfLines={1}
        pointerEvents="none"
      >
        {label}
      </Animated.Text>
      <TextInput
        ref={inputRef}
        value={value}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={styles.input}
        placeholderTextColor="transparent"
        {...props}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HEIGHT,
    borderRadius: radius.big,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  containerFocused: {
    borderColor: colors.primary,
  },
  containerError: {
    borderColor: colors.error,
  },
  labelRest: {
    position: 'absolute',
    left: spacing.lg,
    top: LABEL_REST_TOP,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: withAlpha(colors.paper, textOpacity.secondary),
  },
  labelFloat: {
    position: 'absolute',
    left: spacing.lg,
    top: LABEL_FLOAT_TOP,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: withAlpha(colors.paper, textOpacity.secondary),
  },
  labelFloatFocused: {
    color: colors.primary,
  },
  input: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 12,
    height: 24,
    padding: 0,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.paper,
  },
});
