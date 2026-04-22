import api from './api';

export async function getExercises() {
  const response = await api.get('/exercises');
  return response.data;
}
