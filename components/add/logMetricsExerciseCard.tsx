import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Row } from '../layout/row';
import { Stack } from '../layout/stack';
import { Text } from '../ui/text';
import { SetTargetStepper } from './setTargetStepper';
import { radius, spacing } from '../../constants/theme';
import { ACTIVITY_METRIC_CONFIG } from '../../types/metrics';
import type { ExerciseMetricsBlock, MetricField } from '../../types/metrics';

// Steps (and `duration`'s displayed value) are in the same unit as
// `col.label` (ACTIVITY_METRIC_CONFIG) — 1 here means "1 minute" for
// duration, not 1 second. See toDisplayValue()/toStoredValue() below for
// the seconds↔minutes conversion at the storage boundary.
const METRIC_STEP: Record<MetricField, number> = {
  reps: 1,
  lbs: 5,
  distance: 0.5,
  duration: 1,
  rounds: 1,
};

/** Storage is always native seconds for `duration` (see
 * ACTIVITY_METRIC_CONFIG's own doc comment for why) — these two convert at
 * the one presentation boundary that displays/edits it as minutes instead.
 * Rounds display to 1 decimal place (so a 45s target reads "0.8", not an
 * ugly repeating decimal) without losing precision in what's actually
 * stored — `toStoredValue` rounds to the nearest whole second, same
 * precision the backend column already has. */
function toDisplayValue(field: MetricField, rawSeconds: number): number {
  if (field !== 'duration') return rawSeconds;
  return Math.round((rawSeconds / 60) * 10) / 10;
}

function toStoredValue(field: MetricField, displayValue: number): number {
  if (field !== 'duration') return displayValue;
  return Math.round(displayValue * 60);
}

interface LogMetricsExerciseCardProps {
  exercise: ExerciseMetricsBlock;
  /** Its place in the routine (1-based) — the exercises come in routine order. */
  position?: number;
  onChangeValue: (rowIndex: number, field: MetricField, nextValue: number) => void;
}

/** One exercise card from the Log-Metrics-38A-Target-Stepper wireframe — a
 * `Set N` row per real set, each with one stepper pill per metric target
 * that set actually has (almost always exactly one, per the app's own data:
 * the Routine Creator only ever writes a reps or duration target, never
 * weight — see METRIC_CODE_TO_FIELD in metricsAdapter.ts). The header says how
 * many sets and the target. Sprint 10: it used to carry an "adjusted/total"
 * count and a circle that filled green once every set was changed, which read
 * as "only what you change counts" — untouched sets are saved at their target
 * all the same, so the header no longer tracks changes. */
export function LogMetricsExerciseCard({ exercise, position, onChangeValue }: LogMetricsExerciseCardProps) {
  const { t } = useTranslation();
  const config = ACTIVITY_METRIC_CONFIG[exercise.activityType] ?? ACTIVITY_METRIC_CONFIG.strength;
  const primaryColumn = config.columns[0];
  const primaryTarget = exercise.rows[0]?.targets?.[primaryColumn.key];

  const totalSets = exercise.rows.length;
  const meta = [
    config.showSetColumn ? t('logMetrics.entry.setsCount', { count: totalSets }) : null,
    primaryTarget !== undefined
      ? `${t('logMetrics.entry.targetLabel', { value: toDisplayValue(primaryColumn.key, primaryTarget) })} ${primaryColumn.label}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.card}>
      <Row gap="sm" align="center">
        {position != null ? (
          <Text variant="label" weight="bold" tone="secondary" testID="log-metrics-exercise-number">
            {position}
          </Text>
        ) : null}
        <Text variant="label" weight="bold" style={styles.name} numberOfLines={1}>
          {exercise.name}
        </Text>

        {meta ? (
          <Text variant="caption" tone="secondary">
            {meta}
          </Text>
        ) : null}
      </Row>

      <Stack gap="xs">
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
                  const currentRaw = Number(row[col.key] ?? target);
                  const current = toDisplayValue(col.key, currentRaw);
                  const step = METRIC_STEP[col.key];

                  return (
                    <SetTargetStepper
                      key={col.key}
                      value={current}
                      unitLabel={col.label}
                      adjusted={currentRaw !== target}
                      step={step}
                      onIncrease={() => onChangeValue(rowIndex, col.key, toStoredValue(col.key, current + step))}
                      onDecrease={() => onChangeValue(rowIndex, col.key, Math.max(0, toStoredValue(col.key, current - step)))}
                      onChangeValue={(nextDisplay) => onChangeValue(rowIndex, col.key, Math.max(0, toStoredValue(col.key, nextDisplay)))}
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

// Sprint 10: no card behind each exercise any more (it was the comments sheet's
// frosted glass) — the exercises sit straight on the screen's gradient.
const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderRadius: radius.medium,
    padding: spacing.base,
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
