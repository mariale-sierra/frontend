import api from '../api';

export async function createWorkoutLog(data: { userId: string; routineId?: number }) {
  const response = await api.post('/workout-logs', data);
  return response.data;
}

export async function getWorkoutLog(id: number) {
  const response = await api.get(`/workout-logs/${id}`);
  return response.data;
}
