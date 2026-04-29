import api from '../api';

export async function createRoutine(data: {
  name: string;
  description?: string;
  createdByUserId?: string;
  is_active?: boolean;
}) {
  const response = await api.post('/routine', data);
  return response.data;
}

export async function addExerciseToRoutine(routineId: number, exerciseId: number) {
  const response = await api.post(`/routine/${routineId}/exercises`, { exerciseId });
  return response.data;
}

export async function getRoutines() {
  const response = await api.get('/routine');
  return response.data;
}

export async function getRoutine(id: number) {
  const response = await api.get(`/routine/${id}`);
  return response.data;
}
