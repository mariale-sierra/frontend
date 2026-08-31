import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { colors, radius } from '../../../constants/theme';
import { Text } from '../../ui/text';

interface CreateFlowPrimaryButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  loading?: boolean;
  /** `rest` swaps the fill to the rest/recovery token — e.g. a "Confirm rest day" CTA. Defaults to `primary`. */
  tone?: 'primary' | 'rest';
}

/** Full-width 52px primary CTA — same spec as Challenge-Info's Join button (body/bold/ink on primary, `radius.big`). */
export function CreateFlowPrimaryButton({
  label,
  loading = false,
  disabled = false,
  tone = 'primary',
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
          tone === 'rest' && styles.buttonRest,
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
  buttonRest: {
    backgroundColor: colors.rest,
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
