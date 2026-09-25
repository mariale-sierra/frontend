import { useState } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { Input } from '../ui/input';
import { colors, radius } from '../../constants/theme';

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
 * `ChallengeNameFields` already uses for its own filled input).
 *
 * `radius.big` here on purpose, per explicit "doesn't match the vibe of the
 * app" feedback (2026-09-24) — `Input`'s own default is `radius.medium`
 * (16px, what `ChallengeNameFields` also uses), but the design system's own
 * radius scale calls `big` (28px) out specifically as "hero cards, primary
 * buttons, nav bar, FAB, segmented control track" — the app's real signature
 * shape. Login/register's inputs were the one place still reading as boxy
 * relative to everything else on screen (the pill-shaped submit button right
 * below them, the rounded card around them); this is scoped to `AuthInput`
 * alone, not a change to `Input`'s own shared default. */
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
    borderRadius: radius.big,
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
