import {
  Pressable,
  StyleSheet,
  PressableProps,
  ActivityIndicator,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Text } from './text';

/**
 * ButtonVariant defines the available button styles:
 * - primary: `primary` background, `ink` text, for the one main action on a screen
 * - outline: `ink` background, `paper`-bordered, for secondary actions — NOT
 *   for use in popups/modals (see `neutral` below); still fine for in-page
 *   secondary actions like a "Retry" button in an error state.
 * - danger: solid `error` background, `ink` text, for destructive actions
 * - neutral: solid `primary` background, `ink` text — the solid, non-bordered
 *   secondary/neutral action. Added for `ConfirmationPopup` specifically:
 *   popups never use `outline` (no outline/bordered buttons in a popup,
 *   confirmed design rule) — this is what a popup's "Cancel"/"Back"/"Stay"
 *   button should use instead. Was solid `ink`/`paper` (a dark button) until
 *   switched to match `primary`'s light treatment on explicit request
 *   (2026-08-28) — visually identical to `primary` now by design; the two
 *   variant names stay distinct in code for semantic clarity (which one is
 *   "the main action" vs. "cancel/back") even though they render the same.
 *
 * `activity` (background color driven by workout category) is retired — see
 * design system → Explicitly Rejected Patterns. It now renders identically
 * to `primary`; the variant name is kept so existing call sites compile.
 * - subtle: translucent `paper`@14% fill, no border, `paper` text — added
 *   2026-08-29 for `FollowButton`'s "Following" state, which had been left on
 *   `outline` (bordered) as a deliberate, explicitly-flagged deviation from
 *   its own wireframe's softer translucent-fill/no-border pill (see
 *   havit-design-system-SKILL.md's Search section) until confirmed to read
 *   wrong. Same shape any other "already active/toggled" secondary state can
 *   reuse, not a one-off.
 */
type ButtonVariant = 'primary' | 'activity' | 'outline' | 'danger' | 'neutral' | 'subtle';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** @deprecated the `activity` variant no longer color-codes by category — this prop has no effect. Kept for call-site compatibility. */
  activityType?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  activityType: _activityType,
  leftIcon,
  rightIcon,
  children,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const textColor =
    variant === 'primary' || variant === 'activity' || variant === 'danger' || variant === 'neutral'
      ? colors.ink
      : colors.paper;

  const loaderColor = textColor;

  const variantKey = variant === 'activity' ? 'primary' : variant;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => {
        const computedStyle =
          typeof style === 'function' ? style({ pressed }) : style;

        return [
          styles.button,
          styles[size],
          styles[variantKey],
          pressed && !isDisabled && styles.pressed,
          isDisabled && styles.disabled,
          computedStyle,
        ];
      }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={loaderColor} />
      ) : (
        <>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text
            variant={size === 'sm' ? 'caption' : 'label'}
            style={[
              styles.text,
              { color: textColor },
            ]}
          >
            {children}
          </Text>

          {rightIcon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  // VARIANTS

  primary: {
    backgroundColor: colors.primary,
  },

  outline: {
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: colors.paper,
  },

  danger: {
    backgroundColor: colors.error,
  },

  neutral: {
    backgroundColor: colors.primary,
  },

  subtle: {
    backgroundColor: withAlpha(colors.paper, 0.14),
  },

  // SIZES

  sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },

  // STATES

  pressed: {
    opacity: 0.8,
  },

  disabled: {
    opacity: 0.5,
  },

  text: {
    marginRight: spacing.xs,
  },

  leftIcon: {
    marginRight: spacing.xs,
  },
});
