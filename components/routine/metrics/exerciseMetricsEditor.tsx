import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { ExerciseInput } from './exerciseInput';
import { RestTimeInput } from './restTimeInput';
import { ValueStepper } from '../builder/valueStepper';
import { colors, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { useRoutineBuilder, getTotalRestSeconds } from '../../../store/routineBuilderStore';
import type { ExerciseEntry } from '../../../types/routine';

interface ExerciseMetricsEditorProps {
  exercise: ExerciseEntry;
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const REPS_STEP = 1;
const REST_STEP_SECONDS = 5;

/**
 * Strength exercises are edited uniformly (Sets / Reps per set / Rest
 * between sets — 3 steppers), not as a per-set table. Matches the Routine
 * Creator wireframe (Builder — Strength Expanded) exactly: adding a set
 * copies the current reps/rest instead of resetting them, and changing
 * reps/rest applies to every set at once (see routineBuilderStore's
 * addStrengthSet/setUniformReps/setUniformRestSeconds).
 */
export function ExerciseMetricsEditor({ exercise }: ExerciseMetricsEditorProps) {
  const { t } = useTranslation();
  const {
    addStrengthSet,
    removeStrengthSet,
    setUniformReps,
    setUniformRestSeconds,
    updateSchemaMetricNumber,
    updateSchemaMetricDuration,
  } = useRoutineBuilder();

  if (exercise.metrics.kind === 'strength') {
    const { sets } = exercise.metrics;
    const firstSet = sets[0];
    const restSeconds = firstSet ? getTotalRestSeconds(firstSet) : 0;

    return (
      <View style={styles.strengthCard}>
        <ValueStepper
          label={t('routineCreate.stepper.sets')}
          valueLabel={String(sets.length)}
          onIncrease={() => addStrengthSet(exercise.id)}
          onDecrease={() => removeStrengthSet(exercise.id, sets.length - 1)}
          decreaseDisabled={sets.length <= 1}
        />

        <ValueStepper
          label={t('routineCreate.stepper.repsPerSet')}
          valueLabel={String(firstSet?.reps ?? 0)}
          onIncrease={() => setUniformReps(exercise.id, (firstSet?.reps ?? 0) + REPS_STEP)}
          onDecrease={() => setUniformReps(exercise.id, Math.max(1, (firstSet?.reps ?? 0) - REPS_STEP))}
          decreaseDisabled={(firstSet?.reps ?? 0) <= 1}
        />

        <ValueStepper
          label={t('routineCreate.stepper.restBetweenSets')}
          valueLabel={t('routineCreate.stepper.restSeconds', { seconds: restSeconds })}
          onIncrease={() => setUniformRestSeconds(exercise.id, restSeconds + REST_STEP_SECONDS)}
          onDecrease={() => setUniformRestSeconds(exercise.id, Math.max(0, restSeconds - REST_STEP_SECONDS))}
          decreaseDisabled={restSeconds <= 0}
        />
      </View>
    );
  }

  const schemaMetrics = exercise.metrics;

  return (
    <View style={styles.schemaCard}>
      <Text variant="label" tone="secondary" weight="bold">{schemaMetrics.template.title}</Text>

      <View style={styles.fieldStack}>
        {schemaMetrics.template.fields.map((field) => {
          if (field.type === 'number') {
            const value = schemaMetrics.values[field.key];
            const numericValue = typeof value === 'number' ? value : field.defaultValue;
            const label = field.unit ? `${field.label} (${field.unit})` : field.label;

            return (
              <ExerciseInput
                key={field.key}
                label={label}
                value={String(numericValue)}
                onChangeText={(nextValue) => updateSchemaMetricNumber(exercise.id, field.key, parseNumber(nextValue))}
              />
            );
          }

          const value = schemaMetrics.values[field.key];
          const durationValue =
            typeof value === 'number' || value == null
              ? { minutes: field.defaultMinutes, seconds: field.defaultSeconds }
              : value;

          return (
            <RestTimeInput
              key={field.key}
              label={field.label}
              minutes={String(durationValue.minutes)}
              seconds={String(durationValue.seconds)}
              onChangeMinutes={(nextValue) =>
                updateSchemaMetricDuration(exercise.id, field.key, { minutes: parseNumber(nextValue) })
              }
              onChangeSeconds={(nextValue) =>
                updateSchemaMetricDuration(exercise.id, field.key, { seconds: parseNumber(nextValue) })
              }
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strengthCard: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    gap: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
  schemaCard: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
  fieldStack: {
    gap: spacing.md,
  },
});
