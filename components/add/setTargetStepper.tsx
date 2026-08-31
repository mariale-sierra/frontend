import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../ui/text';
import { IconButton } from '../ui/iconButton';
import { colors, radius, spacing, textOpacity, typography } from '../../constants/theme';

interface SetTargetStepperProps {
  value: number;
  unitLabel: string;
  adjusted: boolean;
  step: number;
  onIncrease: () => void;
  onDecrease: () => void;
  /** Direct entry, per explicit "only +/- buttons, no text input" report —
   * tapping the value itself swaps it for a numeric `TextInput`. Receives
   * the parsed number in the SAME unit `value`/`step` are already in (the
   * caller owns any seconds↔minutes-style conversion, same as it already
   * does for `onIncrease`/`onDecrease` — this component has no opinion on
   * units, just numbers). */
  onChangeValue: (nextValue: number) => void;
}

/** One steppable set-target row (Log-Metrics "Target Stepper" wireframe) —
 * visually distinct from the Routine Creator's `ValueStepper`
 * (components/routine/builder/valueStepper.tsx): here the whole pill IS the
 * value's own recessed track (`ink` bg, border lights up `success` once this
 * set has been adjusted away from its plan), the minus button blends into
 * that same background (`ghost`, no fill of its own) instead of getting a
 * `surface` fill, and only the plus button carries the lime accent.
 *
 * Tap-to-edit added 2026-08-31: the value used to be a read-only `Text`,
 * steppable only one `step` at a time — fine for reps, painfully slow for
 * anything with a wide range (a 45-minute cardio duration is 45+ taps at a
 * step of 1). Tapping it now swaps in a `TextInput` (decimal keypad, so
 * distance/duration's fractional steps stay typeable) styled to match the
 * `Text` it replaces exactly, so the swap doesn't visibly jump.
 */
export function SetTargetStepper({ value, unitLabel, adjusted, step, onIncrease, onDecrease, onChangeValue }: SetTargetStepperProps) {
  const decreaseDisabled = value - step < 0;
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState('');

  function startEditing() {
    setDraftText(String(value));
    setEditing(true);
  }

  function commitEdit() {
    const parsed = parseFloat(draftText);
    if (Number.isFinite(parsed) && parsed >= 0) {
      onChangeValue(parsed);
    }
    setEditing(false);
  }

  return (
    <View style={[styles.pill, adjusted && styles.pillAdjusted]}>
      <IconButton
        name="remove-outline"
        variant="ghost"
        size={32}
        iconSize={16}
        iconColor={colors.paper}
        onPress={onDecrease}
        disabled={decreaseDisabled}
        style={decreaseDisabled && styles.stepButtonDisabled}
      />

      {editing ? (
        <TextInput
          value={draftText}
          onChangeText={setDraftText}
          onBlur={commitEdit}
          onSubmitEditing={commitEdit}
          keyboardType="decimal-pad"
          autoFocus
          selectTextOnFocus
          style={styles.input}
        />
      ) : (
        <Pressable onPress={startEditing} hitSlop={8}>
          <Text variant="body" weight="bold">
            {value}
            <Text variant="caption" tone="tertiary"> {unitLabel}</Text>
          </Text>
        </Pressable>
      )}

      <IconButton
        name="add-outline"
        variant="ghost"
        size={32}
        iconSize={16}
        iconColor={colors.ink}
        onPress={onIncrease}
        style={styles.plusButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderRadius: radius.small,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.ink,
    paddingLeft: spacing.base,
    paddingRight: spacing.sm,
  },
  pillAdjusted: {
    borderColor: colors.success,
  },
  stepButtonDisabled: {
    opacity: 0.4,
  },
  plusButton: {
    borderRadius: radius.big,
    backgroundColor: colors.primary,
  },
  // Matches the `Text variant="body" weight="bold"` it replaces exactly
  // (same family/size/color/opacity) so entering edit mode doesn't visibly
  // shift the pill's contents.
  input: {
    flex: 1,
    padding: 0,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
    color: colors.paper,
    opacity: textOpacity.primary,
  },
});
