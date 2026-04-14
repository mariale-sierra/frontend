import {
  Pressable,
  StyleSheet,
  PressableProps,
  ActivityIndicator,
} from 'react-native';
import { colors, radius, spacing, ActivityType } from '../../constants/theme';
import { Text } from './text';

/**
 * ButtonVariant defines the available button styles:
 * - primary: White background, black text, for main actions
 * - activity: Activity type background color, black text, for activity-specific actions
 * - outline: Black background, white border and text, for secondary actions
 * - danger: Black background, red border and text, for destructive actions
 */
type ButtonVariant = 'primary' | 'activity' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  activityType?: ActivityType;
  rightIcon?: React.ReactNode;
  children: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  activityType,
  rightIcon,
  children,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const textColor =
    variant === 'primary' || variant === 'activity'
      ? colors.textInverse
      : variant === 'danger'
      ? colors.error
      : colors.textPrimary;

  const loaderColor = textColor;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => {
        const computedStyle =
          typeof style === 'function' ? style({ pressed }) : style;

        const variantStyle = variant === 'activity'
          ? activityType
            ? { backgroundColor: colors.activityType[activityType] }
            : styles.primary // fallback to primary if no activityType
          : styles[variant as Exclude<ButtonVariant, 'activity'>];

        return [
          styles.button,
          styles[size],
          variantStyle,
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
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  // VARIANTS

  primary: {
    backgroundColor: colors.primary,
  },

  outline: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.textPrimary,
  },

  danger: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.error,
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
    fontWeight: '600',
    marginRight: spacing.xs,
  },
});