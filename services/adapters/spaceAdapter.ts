import { colors, activityColors } from '../../constants/theme';
import type { ActivityType } from '../../types/activity';
import type { SpaceContract } from '../../types/space';
import type { ExerciseCategory } from '../exercises/exercises.service';

/**
 * `exercise_categories.code` (kebab-case, e.g. `cardio-intense`) <-> the
 * frontend's `ActivityType` (camelCase, e.g. `cardioIntense`) — the same six
 * values, just cased differently on each side. Spaces reuses this exact
 * taxonomy (see `CATEGORY_OPTIONS` in `constants/challengeCreateOptions.ts`)
 * instead of inventing a parallel one.
 *
 * Real, reported bug (2026-09): this used underscore codes
 * (`cardio_intense`) while the live `havit.exercise_categories.code` column
 * actually uses hyphens (`cardio-intense`) — confirmed directly against the
 * API. Every lookup for cardioIntense/cardioLow/mindBody silently missed, so
 * a space using one of those three colors couldn't load its current color
 * when reopening "Manage space" (looked unset), and picking one of those
 * three and hitting Save silently dropped the color entirely (the other
 * three fields still saved fine, so it read as "Save doesn't work" for only
 * some colors).
 */
const CODE_TO_ACTIVITY_TYPE: Record<string, ActivityType> = {
  strength: 'strength',
  'cardio-intense': 'cardioIntense',
  'cardio-low': 'cardioLow',
  flexibility: 'flexibility',
  'mind-body': 'mindBody',
  functional: 'functional',
};

export function activityTypeForCategoryCode(code: string): ActivityType | null {
  return CODE_TO_ACTIVITY_TYPE[code] ?? null;
}

/** Finds the real `exercise_categories` row (id + code + name) matching a
 * given `ActivityType`, from the list returned by `GET /exercises/categories`
 * — lets the "Manage space" form submit a real `activityCategoryId` without
 * hardcoding category ids anywhere in the frontend. */
export function findCategoryForActivityType(
  categories: ExerciseCategory[],
  type: ActivityType,
): ExerciseCategory | null {
  return categories.find((category) => CODE_TO_ACTIVITY_TYPE[category.code] === type) ?? null;
}

/** A space's own accent color (Activity Color System v2, extended to Spaces
 * per the Chats-46A/47C wireframes — see havit-design-system-SKILL.md's
 * Explicitly Rejected Patterns, exception 3). Falls back to the neutral
 * `colors.primary` when the space has no chosen category, same fallback rule
 * challenges use for a dominant category. */
export function getSpaceAccentColor(space: Pick<SpaceContract, 'activityCategory'>): string {
  const type = space.activityCategory ? activityTypeForCategoryCode(space.activityCategory.code) : null;
  return type ? activityColors[type] : colors.primary;
}

export type SpaceMembershipCta =
  | { kind: 'owner' }
  | { kind: 'member' }
  | { kind: 'pending' }
  | { kind: 'join' }
  | { kind: 'request' };

/** Which CTA a space's card/info screen should show for the current viewer —
 * matches wireframe 46A's "Join" (public) vs "Request to join" (private)
 * pills, plus the member/owner/pending states the wireframe doesn't need a
 * pill for at all. */
export function getSpaceMembershipCta(space: SpaceContract): SpaceMembershipCta {
  if (space.role === 'owner') return { kind: 'owner' };
  if (space.isMember) return { kind: 'member' };
  if (space.hasPendingRequest) return { kind: 'pending' };
  return space.visibility === 'public' ? { kind: 'join' } : { kind: 'request' };
}
