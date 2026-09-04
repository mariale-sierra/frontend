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

/** Legacy contract: the routine builder's Add-Exercises screen
 * (app/challenge/routine/exercises.tsx) still loads the WHOLE catalog once
 * and filters client-side — it predates `getExerciseList`'s real pagination.
 * `GET /exercises` itself is paginated now (601 RepDB exercises, no longer
 * the original ~27), so this wraps that same endpoint with a large
 * `pageSize` and unwraps `.data` back into a bare array, preserving the
 * shape that screen's `data.map(...)` expects — real bug, found 2026-09-04:
 * this used to return the paginated `{data,page,pageSize,total}` envelope
 * directly, which broke `data.map is not a function` there. */
export async function getExercises() {
  const response = await api.get<PaginatedResult<ExerciseListRow>>('/exercises', {
    params: { pageSize: 1000 },
  });
  return response.data.data;
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

// ---------------------------------------------------------------------------
// RepDB exercise catalog — list/detail/muscle-browser endpoints
// ---------------------------------------------------------------------------

export interface ExerciseListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  location?: string;
  region?: string;
  muscle?: string;
  locale?: string;
}

export interface ExerciseListRow {
  id: number;
  slug: string;
  name: string;
  imageUrl: string | null;
  category: { code: string; name: string } | null;
  locations: { code: string; name: string }[];
  region: { code: string; name: string } | null;
  trackingMode: string;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** GET /exercises — paginated, filterable, multilingual-search catalog list.
 * Always carries an image URL (RepDB exercises always have at least one
 * asset) so a list row never has to render without a thumbnail. */
export async function getExerciseList(query: ExerciseListQuery = {}): Promise<PaginatedResult<ExerciseListRow>> {
  const response = await api.get<PaginatedResult<ExerciseListRow>>('/exercises', { params: query });
  return response.data;
}

export interface ExerciseDetail {
  id: number;
  slug: string;
  name: string;
  description: string;
  instructions: string[];
  tips: string[];
  region: { code: string; name: string } | null;
  categories: { code: string; name: string; isPrimary: boolean }[];
  locations: { code: string; name: string; isPrimary: boolean }[];
  muscles: {
    id: number;
    code: string;
    name: string;
    role: 'primary' | 'secondary';
    region: { code: string; name: string };
  }[];
  assets: { type: string; url: string | null }[];
  metrics: ExerciseMetricConfig[];
}

export async function getExerciseDetail(id: number, locale = 'en'): Promise<ExerciseDetail> {
  const response = await api.get<ExerciseDetail>(`/exercises/${id}/full`, { params: { locale } });
  return response.data;
}

export interface MuscleRegionSummary {
  code: string;
  name: string;
  muscleCount: number;
  /** Representative icon (borrowed from the region's first RepDB-iconed
   * muscle, e.g. Chest -> pectoralis_major) — regions have no image asset
   * of their own. Null only for `full_body`, which has no child muscles. */
  iconUrl: string | null;
}

export async function getMuscleRegions(): Promise<MuscleRegionSummary[]> {
  const response = await api.get<MuscleRegionSummary[]>('/exercises/muscle-regions');
  return response.data;
}

export interface MuscleSvgPartDto {
  view: 'front' | 'back';
  side: 'left' | 'right' | 'center';
  svgPartId: string;
  coverage: 'exact' | 'grouped' | 'partial' | 'unavailable';
  isFallback: boolean;
}

export interface MuscleSummary {
  id: number;
  code: string;
  name: string;
  iconUrl: string | null;
  svgParts: MuscleSvgPartDto[];
}

export async function getMusclesInRegion(regionCode: string): Promise<MuscleSummary[]> {
  const response = await api.get<MuscleSummary[]>(`/exercises/muscle-regions/${regionCode}/muscles`);
  return response.data;
}

export interface MuscleExerciseRow {
  id: number;
  slug: string;
  name: string;
  imageUrl: string | null;
}

export interface MuscleDetail {
  id: number;
  code: string;
  name: string;
  region: { code: string; name: string };
  iconUrl: string | null;
  svgParts: MuscleSvgPartDto[];
  primaryExercises: PaginatedResult<MuscleExerciseRow>;
  secondaryExercises: PaginatedResult<MuscleExerciseRow>;
}

export async function getMuscleDetail(code: string, page = 1, pageSize = 20): Promise<MuscleDetail> {
  const response = await api.get<MuscleDetail>(`/exercises/muscles/${code}`, { params: { page, pageSize } });
  return response.data;
}
