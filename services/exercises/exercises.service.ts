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

/** GET /exercises/count?categories=...&locations=... (backend added
 * 2026-08-29, commit `bfd502f`) — real category/location display names
 * (`CATEGORY_OPTIONS`/`LOCATION_OPTIONS`'s `.value`, e.g. "Cardio Intense"),
 * comma-joined, matching `exercise_categories.name`/`exercise_locations.name`
 * exactly (same names `selectedCategories`/`selectedLocations` already store
 * — no mapping needed). Empty arrays count every active exercise.
 *
 * Uses axios's own `params` serialization, NOT `URLSearchParams` — fixed
 * 2026-08-29, real bug: `URLSearchParams` isn't used anywhere else in this
 * app and React Native's bundled polyfill for it has a long history of
 * being unreliable, which matched the exact reported symptom (the count
 * worked with no filters, but dropped to 0 the moment any category/location
 * was actually selected — i.e. exactly when the query string construction
 * stopped being trivially empty). `api`'s axios instance already reliably
 * serializes `params` for every other request in the app. */
export async function getExerciseCount(categories: string[], locations: string[]): Promise<number> {
  const params: Record<string, string> = {};
  if (categories.length > 0) params.categories = categories.join(',');
  if (locations.length > 0) params.locations = locations.join(',');
  const response = await api.get<{ count: number }>('/exercises/count', { params });
  return response.data.count;
}

export async function getBodyParts(): Promise<BodyPart[]> {
  const response = await api.get('/exercises/body-parts');
  return response.data;
}

/** GET /exercises/categories — the same exercise-category taxonomy
 * challenges use for their dominant activity color, reused by Spaces'
 * "Activity Color" picker (wireframe 47C) instead of a duplicate list. */
export interface ExerciseCategory {
  id: number;
  code: string;
  name: string;
}

export async function getExerciseCategories(): Promise<ExerciseCategory[]> {
  const response = await api.get<ExerciseCategory[]>('/exercises/categories');
  return Array.isArray(response.data) ? response.data : [];
}
