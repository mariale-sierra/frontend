import { addMetricToWorkoutLogExercise, addMetricToWorkoutLogExerciseSet } from './metrics.service';
import { ACTIVITY_METRIC_CONFIG } from '../../types/metrics';
import type { ExerciseMetricsBlock, MetricField } from '../../types/metrics';
import type { WorkoutLogContract, WorkoutMetricCode } from '../../types/workout-log';

// 'rounds' has no matching backend metric_type yet, so it's intentionally
// left unmapped — those rows are skipped rather than sent under a wrong code.
// Real backend metric_type codes are 'time'/'distance', not the assumed
// 'duration'/'distanceKm' from the old seed file — same bug as
// metricsAdapter.ts's activityTypeFromMetricCodes(), fixed 2026-08-28 (see
// havit-design-system-SKILL.md). Under the old codes, every logged
// distance/duration value was silently sent to the backend under a code it
// doesn't recognize.
const FIELD_TO_METRIC_CODE: Partial<Record<MetricField, WorkoutMetricCode>> = {
  reps: 'reps',
  lbs: 'weight',
  duration: 'time',
  distance: 'distance',
};

/**
 * Persists the reps/weight/duration/distance values entered on the metrics
 * screen against the just-created workout log's exercises. The routine copy
 * inside POST /workout-logs/progress only creates target (goal) rows —
 * without this call the values the user actually typed are never sent to
 * the backend at all. Matches each metrics block to its WorkoutLogExercise
 * by exercise id. Returns how many individual metric values were saved.
 *
 * Per-set granularity (fixed 2026-08-29, backend commit `bfd502f` added
 * POST /metrics/workout-log-exercise-sets/:id): when `wle.sets` has real
 * backend rows (createWorkout() copies them over whenever the routine
 * exercise had any — the strength/functional case, `showSetColumn: true`),
 * EVERY row with a value is now submitted against its own set id, not just
 * the first one found. A block whose exercise has no real backend sets
 * (most cardio/flexibility/mind-body exercises, which only ever get
 * exercise-level targets, no per-set rows) falls back to the previous
 * exercise-level single-value behavior — there's only ever one editable row
 * for those anyway (`ACTIVITY_METRIC_CONFIG[...].defaultRows === 1`), so no
 * per-set granularity is actually lost by that fallback.
 *
 * Every write below runs concurrently (`Promise.allSettled`), not one
 * sequential `await` after another — a strength exercise with 3 sets now
 * makes up to 6 individual calls (one per set per column), and awaiting
 * those one at a time visibly stalled the camera confirm flow (fixed
 * 2026-08-29, per user report: the screen sat on a spinner far longer than
 * before this granularity landed). A single write failing (e.g. an older
 * exercise whose `exercise_metrics` was never backfilled) no longer holds up
 * or skips the rest — each call is independent and already best-effort (see
 * metrics.service.ts's `suppressErrorToast` on these two calls specifically,
 * fixed the same day: a failure here must not pop the shared global error
 * toast, since the caller already treats it as non-fatal).
 */
export async function applyExerciseMetrics(
  workout: WorkoutLogContract,
  exerciseMetrics: ExerciseMetricsBlock[],
): Promise<number> {
  const wles = workout.exercises ?? [];
  const writes: Array<() => Promise<unknown>> = [];

  for (const block of exerciseMetrics) {
    const wle = wles.find((candidate) => candidate.exercise?.id === block.exerciseId);
    if (!wle) continue;

    const columns = ACTIVITY_METRIC_CONFIG[block.activityType].columns;
    const wleSets = wle.sets ?? [];

    if (wleSets.length > 0) {
      for (const row of block.rows) {
        const wleSet = wleSets.find((candidate) => candidate.setNumber === row.set);
        if (!wleSet) continue;

        for (const column of columns) {
          const metricCode = FIELD_TO_METRIC_CODE[column.key];
          if (!metricCode) continue;

          const raw = (row[column.key] ?? '').trim();
          if (!raw) continue;

          const value = parseFloat(raw);
          if (!Number.isFinite(value)) continue;

          writes.push(() => addMetricToWorkoutLogExerciseSet(wleSet.id, metricCode, value));
        }
      }
      continue;
    }

    for (const column of columns) {
      const metricCode = FIELD_TO_METRIC_CODE[column.key];
      if (!metricCode) continue;

      const firstRow = block.rows.find((row) => (row[column.key] ?? '').trim().length > 0);
      if (!firstRow) continue;

      const value = parseFloat(firstRow[column.key] ?? '');
      if (!Number.isFinite(value)) continue;

      writes.push(() => addMetricToWorkoutLogExercise(wle.id, metricCode, value));
    }
  }

  const results = await Promise.allSettled(writes.map((run) => run()));
  return results.filter((result) => result.status === 'fulfilled').length;
}
