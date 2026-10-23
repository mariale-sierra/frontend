import type { ActivityType } from '../../types/activity';
import type { ExerciseCandidate } from '../../hooks/useFilteredExercises';
import type { ExerciseListRow, ExerciseMetricConfig } from '../exercises/exercises.service';
import { CATEGORY_TO_ACTIVITY } from '../../constants/challengeFilters';
import { LOCATION_OPTIONS } from '../../constants/challengeCreateOptions';

/**
 * Pure mapping for the routine exercise picker (app/challenge/routine/exercises.tsx):
 * catalog rows -> picker candidates, and an exercise's real metrics -> the
 * routine builder's metric template. Moved out of the screen in Sprint 10, B10
 * so it can be tested on its own; behavior unchanged.
 */

// Real backend location codes for the challenge builder's own selected display names
// (e.g. "Gym" -> "gym") — LOCATION_OPTIONS is the same constant the Activity & Location
// step itself renders its pills from, so there's no separate source of truth to drift.
export const LOCATION_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  LOCATION_OPTIONS.map((option) => [option.value, option.type]),
);

export interface ExerciseRowCandidate extends ExerciseCandidate {
  imageUrl: string | null;
  meta: string;
}

export function toCandidate(row: ExerciseListRow, defaultLocationLabel: string): ExerciseRowCandidate {
  const categoryName = row.category?.name;
  const activityType: ActivityType = (categoryName && CATEGORY_TO_ACTIVITY[categoryName]) || 'strength';
  const metricType: ExerciseCandidate['metricType'] = row.trackingMode === 'sets' ? 'strength' : 'schema';
  const locationLabel = row.locations.length ? row.locations.map((l) => l.name).join(' / ') : defaultLocationLabel;

  return {
    id: String(row.id),
    name: row.name,
    location: locationLabel,
    metricType,
    activityType,
    muscleGroups: [],
    imageUrl: row.imageUrl,
    meta: `${categoryName ?? ''} · ${locationLabel}`,
  };
}

/** Converts GET /exercises/:id/full's real per-exercise `metrics[]` into the
 * raw shape `routineBuilderStore`'s `applyBackendMetricTemplate` already
 * validates and consumes — the first-choice source, when an exercise
 * actually has real `exercise_metrics` rows (curated/manually-added
 * exercises can; the RepDB-imported catalog never does, see
 * `buildActivityMetricTemplate`'s doc comment in routineAdapter.ts for that
 * whole story). Only 'int'/'decimal' (-> a `number` field) and 'seconds'
 * (-> a `duration` field) map to anything the schema template UI can render
 * today; 'text'/'boolean' metrics are skipped rather than guessed. Returns
 * null when no metric maps to a renderable field, so the caller falls back
 * to `buildActivityMetricTemplate`'s category-aware template instead of
 * applying an empty one. */
export function buildMetricTemplateFromExerciseMetrics(exerciseId: number, metrics: ExerciseMetricConfig[]): unknown | null {
  const fields = metrics
    .map((metric) => {
      if (metric.valueType === 'seconds') {
        return { key: metric.code, label: metric.name, type: 'duration' as const, defaultMinutes: 10, defaultSeconds: 0 };
      }
      if (metric.valueType === 'int' || metric.valueType === 'decimal') {
        return {
          key: metric.code,
          label: metric.name,
          type: 'number' as const,
          defaultValue: 10,
          unit: metric.defaultUnit ?? undefined,
          min: 0,
        };
      }
      return null;
    })
    .filter((field): field is NonNullable<typeof field> => field !== null);

  if (fields.length === 0) return null;

  return { id: `exercise-${exerciseId}-metrics`, title: 'Exercise metrics', fields };
}
