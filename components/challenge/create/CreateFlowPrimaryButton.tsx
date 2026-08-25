import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { colors, radius } from '../../../constants/theme';
import { Text } from '../../ui/text';

interface CreateFlowPrimaryButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  loading?: boolean;
}

/** Full-width 52px primary CTA — same spec as Challenge-Info's Join button (body/bold/ink on primary, `radius.big`). */
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
        <ActivityIndicator color={colors.ink} />
      ) : (
        <Text variant="body" weight="bold" style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.ink,
    opacity: 1,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
});
