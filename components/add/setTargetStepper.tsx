import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { IconButton } from '../ui/iconButton';
import { colors, radius, spacing } from '../../constants/theme';

interface SetTargetStepperProps {
  value: number;
  unitLabel: string;
  adjusted: boolean;
  step: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

/** One steppable set-target row (Log-Metrics "Target Stepper" wireframe) —
 * visually distinct from the Routine Creator's `ValueStepper`
 * (components/routine/builder/valueStepper.tsx): here the whole pill IS the
 * value's own recessed track (`ink` bg, border lights up `primary` once this
 * set has been adjusted away from its plan), the minus button blends into
 * that same background (`ghost`, no fill of its own) instead of getting a
 * `surface` fill, and only the plus button carries the lime accent. */
export function SetTargetStepper({ value, unitLabel, adjusted, step, onIncrease, onDecrease }: SetTargetStepperProps) {
  const decreaseDisabled = value - step < 0;

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

      <Text variant="body" weight="bold">
        {value}
        <Text variant="caption" tone="tertiary"> {unitLabel}</Text>
      </Text>

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
    borderColor: colors.primary,
  },
  stepButtonDisabled: {
    opacity: 0.4,
  },
  plusButton: {
    borderRadius: radius.big,
    backgroundColor: colors.primary,
  },
});
