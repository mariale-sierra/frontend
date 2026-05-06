import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { Text } from '../ui/text';

interface CreateFlowPrimaryButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  loading?: boolean;
}

export function CreateFlowPrimaryButton({
  label,
  loading = false,
  disabled = false,
  style,
  ...props
}: CreateFlowPrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={({ pressed }) => {
        const computedStyle = typeof style === 'function' ? style({ pressed }) : style;
        return [
          styles.button,
          pressed && !isDisabled && styles.pressed,
          isDisabled && styles.disabled,
          computedStyle,
        ];
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.textInverse} />
      ) : (
        <Text variant="label" style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.textPrimary,
  },
  label: {
    color: colors.textInverse,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.52,
  },
});