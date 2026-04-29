export interface CreateWorkoutLogRequest {
  userId: string;
  routineId?: number;
}

export interface WorkoutLogExerciseContract {
  id: number;
  exercise: {
    id: number;
    name: string;
  };
  [key: string]: unknown;
}

export interface WorkoutLogContract {
  id: number;
  exercises?: WorkoutLogExerciseContract[];
  [key: string]: unknown;
}

export type WorkoutMetricCode = 'reps' | 'weight';

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
