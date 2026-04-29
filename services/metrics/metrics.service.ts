import api from '../api';
import type {
  AddWorkoutLogExerciseMetricRequest,
  WorkoutMetricCode,
  WorkoutMetricEntryContract,
} from '../../types/workout-log';

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
  );
  return response.data;
}
