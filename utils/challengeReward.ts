import { getBadgeMetric } from '../constants/badges';
import type { BadgeContract } from '../types/badge';

/**
 * What finishing a challenge did for the challenge badges (Sprint 10, B2).
 * Finishing a challenge is not the same as getting a badge: only some counts of
 * completed challenges have one (BADGE_CATALOG: 1 and 3), so most completions
 * only move the count toward the next one.
 */
export type ChallengeRewardOutcome =
  | { kind: 'earned'; badgeCode: string }
  | { kind: 'next'; badgeCode: string; remaining: number }
  | { kind: 'allEarned' };

/**
 * Reads GET /badges/me right after the challenge was marked completed.
 * `progress` is capped at each badge's target, so the exact count is only known
 * while the highest challenge badge is still unearned; once it is earned the
 * honest answer is "you have them all", whatever the real count.
 */
export function challengeRewardFromBadges(badges: BadgeContract[]): ChallengeRewardOutcome | null {
  const challengeBadges = badges
    .filter((badge) => getBadgeMetric(badge.code) === 'challenges' && badge.target > 0)
    .sort((a, b) => a.target - b.target);
  if (challengeBadges.length === 0) return null;

  const highest = challengeBadges[challengeBadges.length - 1];
  if (highest.earned) return { kind: 'allEarned' };

  const completed = highest.progress;
  // Called right after a completion, so 0 means the badges do not reflect it
  // yet: say nothing rather than "1 to go" for the challenge just finished.
  if (completed === 0) return null;
  const justEarned = challengeBadges.find((badge) => badge.earned && badge.target === completed);
  if (justEarned) return { kind: 'earned', badgeCode: justEarned.code };

  const next = challengeBadges.find((badge) => !badge.earned);
  if (!next) return { kind: 'allEarned' };
  return { kind: 'next', badgeCode: next.code, remaining: next.target - completed };
}
