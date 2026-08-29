import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Text } from '../../ui/text';
import { colors, radius, spacing } from '../../../constants/theme';

interface RestDayPrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/** Solid `ink` bg / `rest`-colored text — the primary CTA treatment on top of
 * `RestDayScreenBackground`'s rest-purple gradient (Rest-Or-Plan-28C
 * wireframe). Doesn't match any existing `Button`/`CreateFlowPrimaryButton`
 * tone (both of those put `ink` text ON a light fill — here the fill IS
 * `rest`-purple, same as the screen behind it, so `rest`-colored text on an
 * `ink` fill is what actually stays legible against this specific
 * background). Shared by `RestDayContent.tsx`'s "Just today" and
 * `app/challenge/routine/select.tsx`'s "Confirm rest day", so it doesn't get
 * rebuilt inline a second time. */
export function RestDayPrimaryButton({ label, onPress, loading = false, disabled = false }: RestDayPrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.rest} />
      ) : (
        <Text variant="label" weight="bold" style={styles.text}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    paddingVertical: spacing.md,
    borderRadius: radius.big,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.rest,
    opacity: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
