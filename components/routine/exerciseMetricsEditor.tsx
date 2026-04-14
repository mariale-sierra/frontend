import { Pressable, StyleSheet, View } from 'react-native';
import { Row } from '../layout/row';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { ExerciseInput } from './exerciseInput';
import { RestTimeInput } from './restTimeInput';
import { routineStyles } from './routineStyles';
import { colors, radius, spacing } from '../../constants/theme';
import { useRoutineBuilder } from '../../store/routineBuilderStore';
import type { ExerciseEntry } from '../../store/routineBuilderStore';

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
    updateExerciseMetrics,
  } = useRoutineBuilder();

  if (exercise.metrics.kind === 'strength') {
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

          {exercise.metrics.sets.map((row, index) => (
            <View key={`${exercise.id}-${index}`} style={styles.setSection}>
              {index > 0 ? <View style={routineStyles.divider} /> : null}
              <Row justify="space-between" align="center" style={styles.setHeader}>
                <Text variant="subheader">SET {row.setNumber}</Text>
                <Pressable
                  onPress={() => removeStrengthSet(exercise.id, index)}
                  disabled={exercise.metrics.sets.length <= 1}
                  style={({ pressed }) => [styles.removeButton, pressed && exercise.metrics.sets.length > 1 && styles.pressed]}
                >
                  <Text variant="caption" style={[styles.removeText, exercise.metrics.sets.length <= 1 && styles.disabledText]}>
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

  return (
    <View style={styles.bleedWrap}>
      <View style={styles.container}>
        <Text variant="label" style={styles.headingText}>Exercise metrics</Text>
        <View style={styles.fieldStack}>
          {(exercise.metrics.kind === 'distance' || exercise.metrics.kind === 'distance-duration') && (
            <ExerciseInput
              label="Distance km"
              value={String(exercise.metrics.distanceKm)}
              onChangeText={(value) => updateExerciseMetrics(exercise.id, { distanceKm: parseNumber(value) })}
            />
          )}

          {(exercise.metrics.kind === 'duration' || exercise.metrics.kind === 'distance-duration') && (
            <RestTimeInput
              label="Duration"
              minutes={String(exercise.metrics.durationMin)}
              seconds={String(exercise.metrics.durationSec)}
              onChangeMinutes={(value) => updateExerciseMetrics(exercise.id, { durationMin: parseNumber(value) })}
              onChangeSeconds={(value) => updateExerciseMetrics(exercise.id, { durationSec: parseNumber(value) })}
            />
          )}
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