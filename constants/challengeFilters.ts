// MOCK mapping used by challenge creation filters during offline design.
// Backend team: categories should come from DB/API with canonical activityType values.
// Frontend should eventually consume those values directly and remove this static map.

import type { ActivityType } from '../types/activity';

export const CATEGORY_TO_ACTIVITY: Record<string, ActivityType> = {
  Strength: 'strength',
  'Cardio Intense': 'cardioIntense',
  'Cardio Low': 'cardioLow',
  Flexibility: 'flexibility',
  'Mind-Body': 'mindBody',
  Functional: 'functional',
};

/** Real, stable `exercise_categories.code` -> `ActivityType`, for the RepDB
 * exercise catalog (which has real codes to key off, unlike the display-name
 * mock above).
 *
 * Canonical codes use underscores (`cardio_intense`, `cardio_low`,
 * `mind_body`) — confirmed directly against the live API on 2026-09-21
 * (`GET /exercises/categories` and every exercise's own `category.code`),
 * and the same convention the backend's own
 * `2026-09-08-03-normalize-exercise-catalog-codes.sql` migration treats as
 * canonical, normalizing any leftover legacy hyphenated row to it. An
 * earlier version of this map (and its near-duplicate in
 * `services/adapters/spaceAdapter.ts`) had this backwards — hyphenated keys,
 * based on a "verified live" claim that turned out to be stale/wrong by the
 * time of this fix — which is exactly the kind of mistake `normalizeCategoryCode`
 * below exists to make harmless: every real lookup goes through
 * `activityTypeForCategoryCode`, which normalizes first, so it doesn't
 * matter which separator a given row actually has. */
export const CATEGORY_CODE_TO_ACTIVITY: Record<string, ActivityType> = {
  strength: 'strength',
  cardio_intense: 'cardioIntense',
  cardio_low: 'cardioLow',
  flexibility: 'flexibility',
  mind_body: 'mindBody',
  functional: 'functional',
};

/** Normalizes a raw `exercise_categories.code` to the canonical (underscored)
 * form before it's used as a lookup key anywhere — hyphens only ever come
 * from a stray legacy row (see `CATEGORY_CODE_TO_ACTIVITY`'s doc comment). */
export function normalizeCategoryCode(code: string): string {
  return code.replace(/-/g, '_');
}

/** The one real entry point for turning a raw `exercise_categories.code`
 * into an `ActivityType` — normalizes first, so it never matters whether a
 * given row happens to be hyphenated or underscored. Prefer this over
 * indexing `CATEGORY_CODE_TO_ACTIVITY` directly. */
export function activityTypeForCategoryCode(code: string | null | undefined): ActivityType | undefined {
  if (!code) return undefined;
  return CATEGORY_CODE_TO_ACTIVITY[normalizeCategoryCode(code)];
}
