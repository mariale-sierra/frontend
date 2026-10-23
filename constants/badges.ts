import type { ComponentProps } from 'react';
import type { Icon } from '../components/ui/icon';
import { activityColors, colors } from './theme';

type IconName = ComponentProps<typeof Icon>['name'];

interface BadgeStyle {
  icon: IconName;
  /** Accent of the earned badge (pairs with `ink`, like every activity color). */
  color: string;
}

/**
 * Presentation of the backend's badge catalog (BADGE_CATALOG in
 * backend/src/badges/badges.service.ts), keyed by badge `code`. The backend only
 * sends code/name/description/progress/target — icon and color live here.
 * A code this app doesn't know yet still renders, with the fallback.
 */
const BADGE_STYLES: Record<string, BadgeStyle> = {
  first_workout: { icon: 'barbell-outline', color: activityColors.strength },
  five_workouts: { icon: 'barbell-outline', color: activityColors.strength },
  ten_workouts: { icon: 'barbell-outline', color: activityColors.strength },
  streak_7_days: { icon: 'flame-outline', color: activityColors.cardioIntense },
  one_challenge_completed: { icon: 'trophy-outline', color: activityColors.functional },
  three_challenges_completed: { icon: 'trophy-outline', color: activityColors.functional },
};

const FALLBACK_STYLE: BadgeStyle = { icon: 'ribbon-outline', color: colors.primary };

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
