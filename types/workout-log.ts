/** A real workout_log_exercise_sets row (createWorkout() copies these over
 * from the routine's own sets when the routine exercise had any) — `id` is
 * what POST /metrics/workout-log-exercise-sets/:id keys its per-set actual
 * value on. Absent/empty for an exercise whose routine only had
 * exercise-level targets (no sets), e.g. most cardio/flexibility exercises. */
export interface WorkoutLogExerciseSetContract {
  id: number;
  setNumber: number;
  [key: string]: unknown;
}

export interface WorkoutLogExerciseContract {
  id: number;
  exercise: {
    id: number;
    name: string;
  };
  sets?: WorkoutLogExerciseSetContract[];
  [key: string]: unknown;
}

export interface WorkoutLogContract {
  id: number;
  exercises?: WorkoutLogExerciseContract[];
  [key: string]: unknown;
}

export type WorkoutMetricCode = 'reps' | 'weight' | 'time' | 'distance';

export interface AddWorkoutLogExerciseMetricRequest {
  metricCode: WorkoutMetricCode;
  value: number;
}

export interface WorkoutMetricEntryContract {
  id?: number;
  metricCode?: string;
  value?: number;
  [key: string]: unknown;
}
