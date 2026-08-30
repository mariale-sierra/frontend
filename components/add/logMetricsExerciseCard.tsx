import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Row } from '../layout/row';
import { Stack } from '../layout/stack';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { SetTargetStepper } from './setTargetStepper';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { countAdjustedSets } from '../../services/adapters/index';
import { ACTIVITY_METRIC_CONFIG } from '../../types/metrics';
import type { ExerciseMetricsBlock, MetricField } from '../../types/metrics';

const METRIC_STEP: Record<MetricField, number> = {
  reps: 1,
  lbs: 5,
  distance: 0.5,
  duration: 5,
  rounds: 1,
};

interface LogMetricsExerciseCardProps {
  exercise: ExerciseMetricsBlock;
  onChangeValue: (rowIndex: number, field: MetricField, nextValue: number) => void;
}

/** One exercise card from the Log-Metrics-38A-Target-Stepper wireframe — a
 * `Set N` row per real set, each with one stepper pill per metric target
 * that set actually has (almost always exactly one, per the app's own data:
 * the Routine Creator only ever writes a reps or duration target, never
 * weight — see METRIC_CODE_TO_FIELD in metricsAdapter.ts). The leading
 * circle is a derived "all sets adjusted" indicator, not a manual toggle —
 * there's no backend concept of a per-exercise checkbox to back one. */
export function LogMetricsExerciseCard({ exercise, onChangeValue }: LogMetricsExerciseCardProps) {
  const { t } = useTranslation();
  const config = ACTIVITY_METRIC_CONFIG[exercise.activityType] ?? ACTIVITY_METRIC_CONFIG.strength;
  const primaryColumn = config.columns[0];
  const primaryTarget = exercise.rows[0]?.targets?.[primaryColumn.key];

  const totalSets = exercise.rows.length;
  const adjustedCount = countAdjustedSets(exercise);
  const allAdjusted = totalSets > 0 && adjustedCount === totalSets;

  return (
    <View style={styles.card}>
      <Row gap="sm" align="center">
        <View style={[styles.indicator, allAdjusted && styles.indicatorDone]}>
          {allAdjusted && <Icon name="checkmark-outline" size={13} color={colors.ink} />}
        </View>

        <Text variant="label" weight="bold" style={styles.name} numberOfLines={1}>
          {exercise.name}
        </Text>

        <Text variant="caption" tone="secondary">
          {t('logMetrics.entry.setsProgress', { done: adjustedCount, total: totalSets })}
          {primaryTarget !== undefined
            ? ` · ${t('logMetrics.entry.targetLabel', { value: primaryTarget })}`
            : ''}
        </Text>
      </Row>

      <Stack gap="sm">
        {exercise.rows.map((row, rowIndex) => {
          const visibleColumns = config.columns.filter((col) => row.targets?.[col.key] !== undefined);
          const columns = visibleColumns.length > 0 ? visibleColumns : [primaryColumn];

          // Real bug, fixed 2026-08-29, per explicit report: "Set 1" read as
          // confusing on a single-row schema exercise like Brisk Walk —
          // there's no real concept of "sets" for a duration/distance
          // session, just one continuous target. `config.showSetColumn`
          // already exists precisely to distinguish this (true only for
          // strength/functional) but wasn't actually wired up here.
          return (
            <Row key={row.set} gap="sm" align="center">
              {config.showSetColumn && (
                <Text variant="label" weight="medium" tone="secondary" style={styles.setLabel}>
                  {t('logMetrics.entry.setLabel', { number: row.set })}
                </Text>
              )}

              <Stack gap="xs" style={styles.steppers}>
                {columns.map((col) => {
                  const target = row.targets?.[col.key] ?? 0;
                  const current = Number(row[col.key] ?? target);
                  const step = METRIC_STEP[col.key];

                  return (
                    <SetTargetStepper
                      key={col.key}
                      value={current}
                      unitLabel={col.label}
                      adjusted={current !== target}
                      step={step}
                      onIncrease={() => onChangeValue(rowIndex, col.key, current + step)}
                      onDecrease={() => onChangeValue(rowIndex, col.key, Math.max(0, current - step))}
                    />
                  );
                })}
              </Stack>
            </Row>
          );
        })}
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    padding: spacing.base,
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: radius.big,
    borderWidth: 1.5,
    borderColor: withAlpha(colors.paper, textOpacity.tertiary),
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorDone: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  name: {
    flex: 1,
  },
  setLabel: {
    width: 40,
  },
  steppers: {
    flex: 1,
  },
});
