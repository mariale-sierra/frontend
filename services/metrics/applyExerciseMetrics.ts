import { addMetricToWorkoutLogExercise } from './metrics.service';
import { ACTIVITY_METRIC_CONFIG } from '../../types/metrics';
import type { ExerciseMetricsBlock, MetricField } from '../../types/metrics';
import type { WorkoutLogContract, WorkoutMetricCode } from '../../types/workout-log';

// 'rounds' has no matching backend metric_type yet, so it's intentionally
// left unmapped — those rows are skipped rather than sent under a wrong code.
const FIELD_TO_METRIC_CODE: Partial<Record<MetricField, WorkoutMetricCode>> = {
  reps: 'reps',
  lbs: 'weight',
  duration: 'duration',
  distance: 'distanceKm',
};

/**
 * Persists the reps/weight/duration/distance values entered on the metrics
 * screen against the just-created workout log's exercises. The routine copy
 * inside POST /workout-logs/progress only creates target (goal) rows —
 * without this call the values the user actually typed are never sent to
 * the backend at all. Matches each metrics block to its WorkoutLogExercise
 * by exercise id. Returns how many individual metric values were saved.
 */
export async function applyExerciseMetrics(
  workout: WorkoutLogContract,
  exerciseMetrics: ExerciseMetricsBlock[],
): Promise<number> {
  const wles = workout.exercises ?? [];
  let matchedCount = 0;

  for (const block of exerciseMetrics) {
    const wle = wles.find((candidate) => candidate.exercise?.id === block.exerciseId);
    if (!wle) continue;

    const columns = ACTIVITY_METRIC_CONFIG[block.activityType].columns;

    for (const column of columns) {
      const metricCode = FIELD_TO_METRIC_CODE[column.key];
      if (!metricCode) continue;

      const firstRow = block.rows.find((row) => (row[column.key] ?? '').trim().length > 0);
      if (!firstRow) continue;

      const rawValue = parseFloat(firstRow[column.key] ?? '');
      if (!Number.isFinite(rawValue)) continue;

      // 'duration' is tracked in minutes in the UI but stored in seconds.
      const value = column.key === 'duration' ? rawValue * 60 : rawValue;

      await addMetricToWorkoutLogExercise(wle.id, metricCode, value);
      matchedCount++;
    }
  }

  return matchedCount;
}
