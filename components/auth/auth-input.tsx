import { useState } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { Input } from '../ui/input';
import { colors } from '../../constants/theme';

type AuthInputProps = Omit<ComponentProps<typeof Input>, 'variant' | 'containerStyle' | 'onFocus' | 'onBlur'> & {
  /** Tints the border `colors.error` instead of the usual focus treatment. */
  error?: boolean;
};

/** `Input` sits inside `AuthScreenShell`'s `surface` card, so `variant="filled"`'s
 * own `surface` fill (meant to stand out directly on a screen's `ink`
 * background) was blending into the card around it — same color, no depth.
 * Recessed here to `ink` instead (matching the established "ink slot inside
 * a surface card" pattern used elsewhere, e.g. Log Metrics' set steppers),
 * plus a focus border (same transparent→`primary` treatment
 * `ChallengeNameFields` already uses for its own filled input). */
export function AuthInput({ error = false, ...props }: AuthInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <Input
      {...props}
      variant="filled"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      containerStyle={[
        styles.container,
        focused && styles.containerFocused,
        error && styles.containerError,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  containerFocused: {
    borderColor: colors.primary,
  },
  containerError: {
    borderColor: colors.error,
  },
});
