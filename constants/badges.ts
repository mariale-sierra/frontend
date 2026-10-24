import type { ComponentProps } from 'react';
import type { Icon } from '../components/ui/icon';
import type { BadgeTier } from './theme';

type IconName = ComponentProps<typeof Icon>['name'];

interface BadgeStyle {
  icon: IconName;
  /** How hard it was to earn — its metal (`badgeColors` in the theme). The icon
   * says what it counts; the metal says how far along that is. */
  tier: BadgeTier;
}

/**
 * Presentation of the backend's badge catalog (BADGE_CATALOG in
 * backend/src/badges/badges.service.ts), keyed by badge `code`. The backend only
 * sends code/name/description/progress/target — icon and color live here.
 * A code this app doesn't know yet still renders, with the fallback.
 */
const BADGE_STYLES: Record<string, BadgeStyle> = {
  // First steps.
  // The workout badges each get their own icon (2026-10-23): first steps, then
  // building momentum, then taking off.
  first_workout: { icon: 'footsteps-outline', tier: 'bronze' },
  one_challenge_completed: { icon: 'trophy-outline', tier: 'bronze' },
  // Building the habit.
  five_workouts: { icon: 'trending-up-outline', tier: 'silver' },
  streak_7_days: { icon: 'flame-outline', tier: 'silver' },
  // The hardest.
  ten_workouts: { icon: 'rocket-outline', tier: 'gold' },
  three_challenges_completed: { icon: 'trophy-outline', tier: 'gold' },
};

const FALLBACK_STYLE: BadgeStyle = { icon: 'ribbon-outline', tier: 'bronze' };

export function getBadgeStyle(code: string): BadgeStyle {
  return BADGE_STYLES[code] ?? FALLBACK_STYLE;
}

/** What a badge counts — the `metric` of each BADGE_CATALOG entry in the backend. */
export type BadgeMetric = 'workouts' | 'streak' | 'challenges';

/**
 * Mirror of BADGE_CATALOG's `metric` per code (Sprint 10, B2), so the app can
 * explain how each badge is counted — the API only sends code/name/description/
 * progress/target. A code missing here just gets no extra explanation.
 */
const BADGE_METRICS: Record<string, BadgeMetric> = {
  first_workout: 'workouts',
  five_workouts: 'workouts',
  ten_workouts: 'workouts',
  streak_7_days: 'streak',
  one_challenge_completed: 'challenges',
  three_challenges_completed: 'challenges',
};

export function getBadgeMetric(code: string): BadgeMetric | null {
  return BADGE_METRICS[code] ?? null;
}
