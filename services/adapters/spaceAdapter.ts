import { colors, activityColors } from '../../constants/theme';
import { activityTypeForCategoryCode as sharedActivityTypeForCategoryCode } from '../../constants/challengeFilters';
import type { ActivityType } from '../../types/activity';
import type { SpaceContract } from '../../types/space';
import type { ExerciseCategory } from '../exercises/exercises.service';

/**
 * `exercise_categories.code` <-> the frontend's `ActivityType` — Spaces
 * reuses the exact same taxonomy/mapping the exercise catalog does (see
 * `constants/challengeFilters.ts`'s `CATEGORY_CODE_TO_ACTIVITY`, the one
 * source of truth) instead of keeping its own separate copy, which had
 * drifted out of sync with the live (underscored) codes at one point —
 * confirmed live 2026-09-21, the real cause of a space using
 * cardioIntense/cardioLow/mindBody not loading its current color when
 * reopening "Manage space," and silently dropping that color on Save.
 */
export function activityTypeForCategoryCode(code: string): ActivityType | null {
  return sharedActivityTypeForCategoryCode(code) ?? null;
}

/** Finds the real `exercise_categories` row (id + code + name) matching a
 * given `ActivityType`, from the list returned by `GET /exercises/categories`
 * — lets the "Manage space" form submit a real `activityCategoryId` without
 * hardcoding category ids anywhere in the frontend. */
export function findCategoryForActivityType(
  categories: ExerciseCategory[],
  type: ActivityType,
): ExerciseCategory | null {
  return categories.find((category) => sharedActivityTypeForCategoryCode(category.code) === type) ?? null;
}

/** A space's own accent color (Activity Color System v2, extended to Spaces
 * per the Chats-46A/47C wireframes — see havit-design-system-SKILL.md's
 * Explicitly Rejected Patterns, exception 3). Falls back to the neutral
 * `colors.primary` when the space has no chosen category, same fallback rule
 * challenges use for a dominant category. */
export function getSpaceAccentColor(space: Pick<SpaceContract, 'activityCategory'>): string {
  const type = getSpaceActivityType(space);
  return type ? activityColors[type] : colors.primary;
}

/** The Activity Type a space's chosen category stands for (`null` when it has none) —
 * what its accent color, and its card's orbs, come from. */
export function getSpaceActivityType(space: Pick<SpaceContract, 'activityCategory'>): ActivityType | null {
  return space.activityCategory ? activityTypeForCategoryCode(space.activityCategory.code) : null;
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
