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

/** The reverse of `CATEGORY_TO_ACTIVITY` — an exercise's own `activityType`
 * back to the display name the backend's `categories`/`challenge_category_map`
 * expect. Used to derive a challenge's real categories from the exercises
 * actually picked (see `useCreateChallengeFlow.ts`'s `derivedCategories`),
 * now that the "What kind of training?" step no longer collects this
 * up front. */
export const ACTIVITY_TO_CATEGORY: Record<ActivityType, string> = Object.fromEntries(
  Object.entries(CATEGORY_TO_ACTIVITY).map(([name, type]) => [type, name]),
) as Record<ActivityType, string>;

/** Real, stable `exercise_categories.code` -> `ActivityType`, for the RepDB
 * exercise catalog (which has real codes to key off, unlike the display-name
 * mock above).
 *
 * Real, reported bug (2026-09): this used underscore codes
 * (`cardio_intense`) while the live `havit.exercise_categories.code` column
 * actually uses hyphens (`cardio-intense`), confirmed directly against the
 * API — every lookup for cardio-intense/cardio-low/mind-body silently
 * missed, so those categories showed no icon/color and no translated label
 * in the exercise catalog and routine builder filters. */
export const CATEGORY_CODE_TO_ACTIVITY: Record<string, ActivityType> = {
  strength: 'strength',
  'cardio-intense': 'cardioIntense',
  'cardio-low': 'cardioLow',
  flexibility: 'flexibility',
  'mind-body': 'mindBody',
  functional: 'functional',
};
