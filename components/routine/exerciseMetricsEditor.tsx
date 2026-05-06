import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../ui/text';
import { ExerciseInput } from './exerciseInput';
import { RestTimeInput } from './restTimeInput';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useRoutineBuilder } from '../../store/routineBuilderStore';
import type { ExerciseEntry } from '../../types/routine';

interface ExerciseMetricsEditorProps {
  exercise: ExerciseEntry;
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRestInput(value: string): { restMin: number; restSec: number } {
  const normalized = value.trim();

  if (normalized.length === 0) {
    return { restMin: 0, restSec: 0 };
  }

  if (normalized.includes(':')) {
    const [minutesPart, secondsPart = '0'] = normalized.split(':');
    const minutes = Math.max(0, parseInt(minutesPart || '0', 10));
    const secondsRaw = Math.max(0, parseInt(secondsPart || '0', 10));

    return {
      restMin: minutes + Math.floor(secondsRaw / 60),
      restSec: secondsRaw % 60,
    };
  }

  const totalSeconds = Math.max(0, parseNumber(normalized));

  return {
    restMin: Math.floor(totalSeconds / 60),
    restSec: totalSeconds % 60,
  };
}

export function ExerciseMetricsEditor({ exercise }: ExerciseMetricsEditorProps) {
  const {
    updateStrengthSet,
    removeStrengthSet,
    updateSchemaMetricNumber,
    updateSchemaMetricDuration,
  } = useRoutineBuilder();

  if (exercise.metrics.kind === 'strength') {
    const strengthMetrics = exercise.metrics;

    return (
      <View style={styles.strengthCard}>
        <View style={styles.tableHeader}>
          <View style={styles.setColumn} />
          <Text variant="caption" style={styles.tableHeaderText}>REPS</Text>
          <Text variant="caption" style={styles.tableHeaderText}>REST</Text>
          <View style={styles.removeColumn} />
        </View>

        {strengthMetrics.sets.map((row, index) => {
          const rowIsLast = index === strengthMetrics.sets.length - 1;

          return (
            <View key={`${exercise.id}-${index}`} style={[styles.tableRow, !rowIsLast && styles.tableRowBorder]}>
              <View style={styles.setColumn}>
                <Text variant="caption" style={styles.setNumberText}>{row.setNumber}</Text>
              </View>

              <View style={styles.valueColumn}>
                <TextInput
                  value={String(row.reps)}
                  onChangeText={(value) => updateStrengthSet(exercise.id, index, { reps: parseNumber(value) })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  style={styles.metricInput}
                />
              </View>

              <View style={styles.valueColumn}>
                <TextInput
                  value={`${row.restMin}:${String(row.restSec).padStart(2, '0')}`}
                  onChangeText={(value) => updateStrengthSet(exercise.id, index, parseRestInput(value))}
                  placeholder="0:00"
                  placeholderTextColor={colors.textMuted}
                  style={styles.metricInput}
                />
              </View>

              <Pressable
                onPress={() => removeStrengthSet(exercise.id, index)}
                disabled={strengthMetrics.sets.length <= 1}
                style={({ pressed }) => [
                  styles.removeColumn,
                  strengthMetrics.sets.length <= 1 && styles.removeDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text variant="body" style={styles.removeIcon}>x</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    );
  }

  const schemaMetrics = exercise.metrics;

  return (
    <View style={styles.schemaCard}>
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
  );
}

const styles = StyleSheet.create({
  strengthCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  schemaCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  headingText: {
    color: colors.textPrimary,
    letterSpacing: 1.4,
    paddingHorizontal: spacing.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
    minHeight: 36,
  },
  tableHeaderText: {
    flex: 1,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.44)',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  setColumn: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  removeColumn: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  setNumberText: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 12,
    lineHeight: 14,
  },
  valueText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  metricInput: {
    width: '100%',
    textAlign: 'center',
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    paddingVertical: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  removeIcon: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
    lineHeight: 16,
  },
  removeDisabled: {
    opacity: 0.25,
  },
  fieldStack: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.82,
  },
});