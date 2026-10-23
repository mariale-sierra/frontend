import { challengeRewardFromBadges } from '../challengeReward';
import type { BadgeContract } from '../../types/badge';

/** The real catalog shape (backend BADGE_CATALOG), with `completed` challenges. */
function badgesFor(completed: number, workouts = 10): BadgeContract[] {
  const badge = (code: string, target: number, value: number): BadgeContract => ({
    code,
    name: code,
    description: code,
    earned: value >= target,
    progress: Math.min(value, target),
    target,
  });
  return [
    badge('first_workout', 1, workouts),
    badge('five_workouts', 5, workouts),
    badge('ten_workouts', 10, workouts),
    badge('streak_7_days', 7, 3),
    badge('one_challenge_completed', 1, completed),
    badge('three_challenges_completed', 3, completed),
  ];
}

describe('challengeRewardFromBadges (B2: finishing a challenge vs getting a badge)', () => {
  it('the first finished challenge earns the "1 challenge" badge', () => {
    expect(challengeRewardFromBadges(badgesFor(1))).toEqual({ kind: 'earned', badgeCode: 'one_challenge_completed' });
  });

  it('the second one earns nothing new and says how many are left for the next badge', () => {
    expect(challengeRewardFromBadges(badgesFor(2))).toEqual({
      kind: 'next',
      badgeCode: 'three_challenges_completed',
      remaining: 1,
    });
  });

  it('from the third on, every challenge badge is already earned', () => {
    expect(challengeRewardFromBadges(badgesFor(3))).toEqual({ kind: 'allEarned' });
    expect(challengeRewardFromBadges(badgesFor(7))).toEqual({ kind: 'allEarned' });
  });

  it('ignores workout and streak badges', () => {
    const onlyOthers = badgesFor(1).filter((b) => !b.code.includes('challenge'));
    expect(challengeRewardFromBadges(onlyOthers)).toBeNull();
  });

  it('says nothing when the badges do not reflect the completion yet', () => {
    expect(challengeRewardFromBadges(badgesFor(0))).toBeNull();
  });

  it('says nothing for an empty list (failed or private lookup)', () => {
    expect(challengeRewardFromBadges([])).toBeNull();
  });
});
