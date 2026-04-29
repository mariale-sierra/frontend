import api from '../api';
import type {
  CreateWorkoutLogRequest,
  WorkoutLogContract,
} from '../../types/workout-log';

export async function createWorkoutLog(data: CreateWorkoutLogRequest) {
  const response = await api.post<WorkoutLogContract>('/workout-logs', data);
  return response.data;
}

export async function getWorkoutLog(id: number) {
  const response = await api.get<WorkoutLogContract>(`/workout-logs/${id}`);
  return response.data;
}
