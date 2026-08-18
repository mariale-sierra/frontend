import api from '../api';
import type {
  CreateWorkoutLogRequest,
  WorkoutLogContract,
} from '../../types/workout-log';
import type { ProgressSubmissionRequest } from '../../types/challenge';

export async function createWorkoutLog(data: CreateWorkoutLogRequest) {
  const response = await api.post<WorkoutLogContract>('/workout-logs', data);
  return response.data;
}

export async function getWorkoutLog(id: number) {
  const response = await api.get<WorkoutLogContract>(`/workout-logs/${id}`);
  return response.data;
}

export async function submitWorkoutProgress(
  data: ProgressSubmissionRequest,
): Promise<WorkoutLogContract> {
  const response = await api.post<WorkoutLogContract>('/workout-logs/progress', data);
  return response.data;
}
