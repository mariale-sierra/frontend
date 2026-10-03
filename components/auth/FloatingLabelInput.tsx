import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Icon } from '../ui/icon';
import { colors, radius, spacing, textOpacity, typography } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface FloatingLabelInputProps extends Omit<TextInputProps, 'placeholder' | 'style'> {
  /** Doubles as the placeholder when the field is empty and unfocused — see
   * this component's own doc comment for the floating behavior. */
  label: string;
  /** Tints the border `colors.error` instead of the usual focus treatment. */
  error?: boolean;
}

// 64 -> 44 (matching `Button`'s own natural rendered height at size="md":
// `lineHeight.sm` (20) + 2x `spacing.md` (12) padding = 44, see button.tsx)
// -> 50 ("a tinsy bit taller" follow-up). All the internal label/input
// offsets below are recomputed for this height, not proportionally scaled —
// see each constant's own comment.
const HEIGHT = 50;
const ANIM_MS = 180;
// Centers the resting (placeholder-style) label's ~20px line within the
// pill: (50 - 20) / 2 = 15.
const LABEL_REST_TOP = 15;
// Floated (small-caption) label and the real input beneath it split the
// pill edge-to-edge with no gap or overlap: label spans
// LABEL_FLOAT_TOP -> LABEL_FLOAT_TOP + lineHeight.xs (6 -> 22), input spans
// exactly where that ends -> HEIGHT - INPUT_BOTTOM (22 -> 44).
const LABEL_FLOAT_TOP = 6;
const INPUT_BOTTOM = 6;
const INPUT_HEIGHT = 22;
const REST_RISE = 4;
const FLOAT_SETTLE = 4;
const EYE_ICON_SIZE = 20;
// Room the input's own text reserves on the right when the reveal-password
// button is showing, so typed text never runs under the icon.
const INPUT_RIGHT_WITH_ICON = spacing.lg + 28;

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
 *
 * A password field (`secureTextEntry` passed by the caller) gets a
 * reveal/hide eye button on the right, per explicit "there should be an eye
 * button to be able to see the password you're writing." `secureTextEntry`
 * is intercepted here rather than left to flow through `...props` straight
 * to the underlying `TextInput` — this component owns a `revealed` toggle
 * and computes the EFFECTIVE `secureTextEntry` from both, so the caller
 * still just says "this is a password field" (unchanged from before) and
 * doesn't need to know the reveal toggle exists.
 */
export function FloatingLabelInput({
  label,
  value,
  error = false,
  onFocus,
  onBlur,
  secureTextEntry,
  ...props
}: FloatingLabelInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isPassword = Boolean(secureTextEntry);
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
        secureTextEntry={isPassword && !revealed}
        style={[styles.input, isPassword && styles.inputWithIcon]}
        placeholderTextColor="transparent"
        {...props}
      />
      {isPassword && (
        <Pressable
          onPress={() => setRevealed((r) => !r)}
          hitSlop={8}
          style={styles.eyeButton}
          accessibilityRole="button"
          accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
        >
          <Icon
            name={revealed ? 'eye-off-outline' : 'eye-outline'}
            size={EYE_ICON_SIZE}
            color={withAlpha(colors.paper, textOpacity.secondary)}
          />
        </Pressable>
      )}
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
    bottom: INPUT_BOTTOM,
    height: INPUT_HEIGHT,
    padding: 0,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.paper,
  },
  // Leaves room for the eye button so typed text never runs under it.
  inputWithIcon: {
    right: INPUT_RIGHT_WITH_ICON,
  },
  // Vertically centered in the WHOLE pill (not just the input's own short
  // row) — reads correctly regardless of whether the label is currently
  // resting or floated above it.
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
