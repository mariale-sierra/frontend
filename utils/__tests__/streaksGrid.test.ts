import { getStreakGridLayout } from '../streaksGrid';
import { STREAK_AVATAR_SHARE, STREAK_GRID_COLUMNS } from '../../constants/streaksGrid';
import { spacing } from '../../constants/theme';

describe('getStreakGridLayout', () => {
  it('is three to a row', () => {
    expect(STREAK_GRID_COLUMNS).toBe(3);
  });

  it('shares the room inside the screen’s side margin between the columns', () => {
    const { columnWidth } = getStreakGridLayout(390);

    expect(columnWidth * STREAK_GRID_COLUMNS).toBeCloseTo(390 - spacing.lg * 2, 5);
  });

  it('makes each avatar most of its column, so three fit a row and a fourth could not', () => {
    for (const screenWidth of [320, 360, 390, 430]) {
      const { columnWidth, avatarSize } = getStreakGridLayout(screenWidth);

      expect(avatarSize).toBeLessThanOrEqual(columnWidth * STREAK_AVATAR_SHARE);
      expect(avatarSize).toBeGreaterThan(columnWidth * (STREAK_AVATAR_SHARE - 0.02) - 1);
      // Three side by side fit inside the margins; four could not.
      expect(avatarSize * 3).toBeLessThanOrEqual(screenWidth - spacing.lg * 2);
      expect(avatarSize * 4).toBeGreaterThan(screenWidth - spacing.lg * 2);
    }
  });

  it('is much bigger than the 64px tiles it began with, on a phone', () => {
    expect(getStreakGridLayout(390).avatarSize).toBeGreaterThan(64 * 1.4);
  });

  it('grows with the screen', () => {
    expect(getStreakGridLayout(430).avatarSize).toBeGreaterThan(getStreakGridLayout(360).avatarSize);
  });
});
