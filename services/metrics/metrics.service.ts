import api from '../api';
import type {
  AddWorkoutLogExerciseMetricRequest,
  WorkoutMetricCode,
  WorkoutMetricEntryContract,
} from '../../types/workout-log';

/** GET /metrics's raw metric_types row — used to resolve a metric's string
 * `code` ('reps'/'weight'/'distance'/'time') to its numeric id, which is what
 * POST /routine/:id/exercises's targets[] wants (metric_type_id), unlike the
 * metric-logging endpoints, which take the code directly. */
export interface MetricTypeContract {
  id: number;
  code: string;
  name: string;
  valueType: 'int' | 'decimal' | 'seconds' | 'text' | 'boolean';
  defaultUnit?: string | null;
  description?: string | null;
}

export async function getMetricTypes(): Promise<MetricTypeContract[]> {
  const response = await api.get<MetricTypeContract[]>('/metrics');
  return response.data;
}

// Both functions below are only ever called from applyExerciseMetrics.ts,
// as best-effort writes it already catches/logs and deliberately doesn't
// let block or fail the save flow (see that file's doc comment). Without
// `suppressErrorToast`, ANY single failed call among the many this can make
// per exercise (one per set per column) fires the shared axios interceptor's
// global error toast regardless — misleadingly scary for something the app
// already treats as non-fatal, and a real cause of the "sometimes says
// error" report even when the actual workout+photo saved fine.
export async function addMetricToWorkoutLogExercise(
  wleId: number,
  metricCode: WorkoutMetricCode,
  value: number,
) {
  const payload: AddWorkoutLogExerciseMetricRequest = {
    metricCode,
    value,
  };
  const response = await api.post<WorkoutMetricEntryContract>(
    `/metrics/workout-log-exercises/${wleId}`,
    payload,
    { suppressErrorToast: true },
  );
  return response.data;
}

/** Per-set sibling of addMetricToWorkoutLogExercise — `setId` is a real
 * workout_log_exercise_sets.id (WorkoutLogExerciseSetContract.id), not the
 * exercise id. Upserts (overwrites a set's copied-from-routine plan target
 * with the actual value) rather than rejecting a second write, unlike the
 * exercise-level endpoint. */
export async function addMetricToWorkoutLogExerciseSet(
  setId: number,
  metricCode: WorkoutMetricCode,
  value: number,
) {
  const payload: AddWorkoutLogExerciseMetricRequest = {
    metricCode,
    value,
  };
  const response = await api.post<WorkoutMetricEntryContract>(
    `/metrics/workout-log-exercise-sets/${setId}`,
    payload,
    { suppressErrorToast: true },
  );
  return response.data;
}
