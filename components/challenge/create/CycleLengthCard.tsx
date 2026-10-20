import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { colors, fillOpacity, radius, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

interface CycleLengthCardProps {
  cycleLengthDays: number;
  durationDays: number;
  onChangeCycleLength: (value: number) => void;
  onChangeDuration: (value: number) => void;
  /** Bounds (the store clamps too — these only disable a button at its end). */
  minCycleLength: number;
  maxCycleLength: number;
  maxDuration: number;
}

const STEP_BUTTON_SIZE = 44;

/**
 * Create challenge, 53A: one card, two steppers — "Cycle" (how many days
 * before it starts again, at least 1) and "Challenge length" (total days,
 * never shorter than the cycle). Same round − / + controls as the old
 * Repeats stepper: a neutral chip-fill minus, a `primary` plus.
 */
export function CycleLengthCard({
  cycleLengthDays,
  durationDays,
  onChangeCycleLength,
  onChangeDuration,
  minCycleLength,
  maxCycleLength,
  maxDuration,
}: CycleLengthCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <StepperRow
        testID="cycle-length-stepper"
        label={t('challengeCreate.cycleLength.cycleLabel')}
        hint={t('challengeCreate.cycleLength.cycleHint')}
        value={cycleLengthDays}
        unit={t('challengeCreate.cycleLength.daysUnit', { count: cycleLengthDays })}
        canDecrement={cycleLengthDays > minCycleLength}
        canIncrement={cycleLengthDays < maxCycleLength}
        onDecrement={() => onChangeCycleLength(cycleLengthDays - 1)}
        onIncrement={() => onChangeCycleLength(cycleLengthDays + 1)}
      />
      <View style={styles.divider} />
      <StepperRow
        testID="duration-stepper"
        label={t('challengeCreate.cycleLength.lengthLabel')}
        hint={t('challengeCreate.cycleLength.lengthHint')}
        value={durationDays}
        unit={t('challengeCreate.cycleLength.daysUnit', { count: durationDays })}
        canDecrement={durationDays > cycleLengthDays}
        canIncrement={durationDays < maxDuration}
        onDecrement={() => onChangeDuration(durationDays - 1)}
        onIncrement={() => onChangeDuration(durationDays + 1)}
      />
    </View>
  );
}

function StepperRow({
  testID,
  label,
  hint,
  value,
  unit,
  canDecrement,
  canIncrement,
  onDecrement,
  onIncrement,
}: {
  testID: string;
  label: string;
  hint: string;
  value: number;
  unit: string;
  canDecrement: boolean;
  canIncrement: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.row} testID={testID}>
      <View style={styles.labels}>
        <Text variant="body" weight="bold">
          {label}
        </Text>
        <Text variant="caption" tone="secondary">
          {hint}
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={onDecrement}
          disabled={!canDecrement}
          accessibilityRole="button"
          accessibilityLabel={t('challengeCreate.cycleLength.decreaseA11y', { label })}
          testID={`${testID}-decrement`}
          style={({ pressed }) => [
            styles.stepButton,
            styles.stepButtonNeutral,
            !canDecrement && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Icon name="remove-outline" size={20} color={colors.paper} />
        </Pressable>

        <View style={styles.value}>
          <Text variant="subheader" testID={`${testID}-value`}>
            {value}
          </Text>
          <Text variant="caption" tone="secondary">
            {unit}
          </Text>
        </View>

        <Pressable
          onPress={onIncrement}
          disabled={!canIncrement}
          accessibilityRole="button"
          accessibilityLabel={t('challengeCreate.cycleLength.increaseA11y', { label })}
          testID={`${testID}-increment`}
          style={({ pressed }) => [
            styles.stepButton,
            styles.stepButtonPrimary,
            !canIncrement && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Icon name="add-outline" size={20} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.big,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.base,
  },
  // Same hairline as every in-card divider (`paper` at .08).
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: withAlpha(colors.paper, 0.08),
  },
  labels: {
    flex: 1,
    // Tight title + caption stack (design system's confirmed `2` exception).
    gap: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepButton: {
    width: STEP_BUTTON_SIZE,
    height: STEP_BUTTON_SIZE,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonNeutral: {
    backgroundColor: withAlpha(colors.paper, fillOpacity.chip),
  },
  stepButtonPrimary: {
    backgroundColor: colors.primary,
  },
  value: {
    minWidth: STEP_BUTTON_SIZE,
    alignItems: 'center',
  },
  disabled: {
    opacity: fillOpacity.dim,
  },
  pressed: {
    opacity: 0.85,
  },
});
