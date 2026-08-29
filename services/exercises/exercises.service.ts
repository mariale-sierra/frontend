import api from '../api';

export interface BodyPart {
  id: number;
  name: string;
  level: number;
  parentId: number | null;
}

/** One row of GET /exercises/:id/full's `metrics[]` — this exercise's REAL
 * trackable metrics (`havit.exercise_metrics`), as opposed to the plain
 * `GET /exercises` list, which never includes them at all. */
export interface ExerciseMetricConfig {
  id: number;
  code: string;
  name: string;
  valueType: 'int' | 'decimal' | 'seconds' | 'text' | 'boolean';
  defaultUnit?: string | null;
  description?: string | null;
  isRequired: boolean;
  isPrimary: boolean;
}

export interface ExerciseFull {
  id: number;
  name: string;
  slug: string;
  tracking_mode: string;
  metrics: ExerciseMetricConfig[];
}

export async function getExercises() {
  const response = await api.get('/exercises');
  return response.data;
}

export async function getExerciseFull(id: number): Promise<ExerciseFull> {
  const response = await api.get(`/exercises/${id}/full`);
  return response.data;
}

export async function getBodyParts(): Promise<BodyPart[]> {
  const response = await api.get('/exercises/body-parts');
  return response.data;
}
