import { Pressable, StyleSheet, View } from 'react-native';
import { Row } from '../layout/row';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { ExerciseInput } from './exerciseInput';
import { RestTimeInput } from './restTimeInput';
import { routineStyles } from './routineStyles';
import { colors, radius, spacing } from '../../constants/theme';
import { useRoutineBuilder } from '../../store/routineBuilderStore';
import type { ExerciseEntry } from '../../types/routine';

interface ExerciseMetricsEditorProps {
  exercise: ExerciseEntry;
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ExerciseMetricsEditor({ exercise }: ExerciseMetricsEditorProps) {
  const {
    updateStrengthSet,
    addStrengthSet,
    removeStrengthSet,
    updateSchemaMetricNumber,
    updateSchemaMetricDuration,
  } = useRoutineBuilder();

  if (exercise.metrics.kind === 'strength') {
    const strengthMetrics = exercise.metrics;

    return (
      <View style={styles.bleedWrap}>
        <View style={styles.container}>
          <Row justify="space-between" align="center" style={styles.headingRow}>
            <Text variant="label" style={styles.headingText}>Strength setup</Text>
            <Pressable onPress={() => addStrengthSet(exercise.id)} style={({ pressed }) => [styles.addSetButton, pressed && styles.pressed]}>
              <Icon name="add" size={14} color={colors.textPrimary} />
              <Text variant="caption" style={styles.addSetText}>Add set</Text>
            </Pressable>
          </Row>

          {strengthMetrics.sets.map((row, index) => (
            <View key={`${exercise.id}-${index}`} style={styles.setSection}>
              {index > 0 ? <View style={routineStyles.divider} /> : null}
              <Row justify="space-between" align="center" style={styles.setHeader}>
                <Text variant="subheader">SET {row.setNumber}</Text>
                <Pressable
                  onPress={() => removeStrengthSet(exercise.id, index)}
                  disabled={strengthMetrics.sets.length <= 1}
                  style={({ pressed }) => [styles.removeButton, pressed && strengthMetrics.sets.length > 1 && styles.pressed]}
                >
                  <Text variant="caption" style={[styles.removeText, strengthMetrics.sets.length <= 1 && styles.disabledText]}>
                    Remove
                  </Text>
                </Pressable>
              </Row>

              <View style={styles.fieldStack}>
                <ExerciseInput
                  label="Reps"
                  value={String(row.reps)}
                  onChangeText={(value) => updateStrengthSet(exercise.id, index, { reps: parseNumber(value) })}
                />
                <RestTimeInput
                  minutes={String(row.restMin)}
                  seconds={String(row.restSec)}
                  onChangeMinutes={(value) => updateStrengthSet(exercise.id, index, { restMin: parseNumber(value) })}
                  onChangeSeconds={(value) => updateStrengthSet(exercise.id, index, { restSec: parseNumber(value) })}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Backend-driven path: template + values come from validated server payload.
  // Keep using the same visual components so design language stays consistent.
  const schemaMetrics = exercise.metrics;

  return (
    <View style={styles.bleedWrap}>
      <View style={styles.container}>
        <Text variant="label" style={styles.headingText}>{schemaMetrics.template.title}</Text>
        <View style={styles.fieldStack}>
          {schemaMetrics.template.fields.map((field) => {
            if (field.type === 'number') {
              const value = schemaMetrics.values[field.key];
              const numericValue = typeof value === 'number' ? value : field.defaultValue;
              const label = field.unit ? `${field.label} ${field.unit}` : field.label;

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
    </View>
  );
}

const styles = StyleSheet.create({
  bleedWrap: {
    marginHorizontal: 0,
  },
  container: {
    ...routineStyles.sectionContainer,
  },
  headingRow: {
    ...routineStyles.sectionPadding,
    marginBottom: spacing.sm,
  },
  headingText: {
    color: colors.textPrimary,
    letterSpacing: 1.4,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  addSetText: {
    color: colors.textPrimary,
  },
  setSection: {
    gap: spacing.md,
  },
  setHeader: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  fieldStack: {
    ...routineStyles.fieldStack,
  },
  removeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
  },
  removeText: {
    color: colors.textSecondary,
  },
  disabledText: {
    ...routineStyles.disabledText,
  },
  pressed: {
    ...routineStyles.pressed,
  },
});