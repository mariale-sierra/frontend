import api from '../api';

export interface BodyPart {
  id: number;
  name: string;
  level: number;
  parentId: number | null;
}

export async function getExercises() {
  const response = await api.get('/exercises');
  return response.data;
}

export async function getBodyParts(): Promise<BodyPart[]> {
  const response = await api.get('/exercises/body-parts');
  return response.data;
}
