import api from '../api';
import type { WorkoutLogContract } from '../../types/workout-log';
import type { ProgressSubmissionRequest } from '../../types/challenge';

export async function submitWorkoutProgress(
  data: ProgressSubmissionRequest,
): Promise<WorkoutLogContract> {
  const response = await api.post<WorkoutLogContract>('/workout-logs/progress', data);
  return response.data;
}
