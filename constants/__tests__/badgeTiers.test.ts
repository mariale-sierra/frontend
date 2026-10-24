import { getBadgeStyle } from '../badges';
import { activityColors, badgeColors } from '../theme';

describe('badge tiers', () => {
  it.each([
    ['first_workout', 'bronze'],
    ['one_challenge_completed', 'bronze'],
    ['five_workouts', 'silver'],
    ['streak_7_days', 'silver'],
    ['ten_workouts', 'gold'],
    ['three_challenges_completed', 'gold'],
  ])('%s is %s', (code, tier) => {
    expect(getBadgeStyle(code).tier).toBe(tier);
  });

  it('a badge this app does not know yet still gets a metal', () => {
    expect(getBadgeStyle('some_new_badge').tier).toBe('bronze');
  });

  it("every metal is the theme's own, never an activity color", () => {
    const metals = Object.values(badgeColors).flatMap((metal) => Object.values(metal));
    for (const color of Object.values(activityColors)) {
      expect(metals).not.toContain(color);
    }
  });
});
