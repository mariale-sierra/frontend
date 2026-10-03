import { STREAK_AVATAR_SHARE, STREAK_GRID_COLUMNS } from '../constants/streaksGrid';
import { spacing } from '../constants/theme';

export interface StreakGridLayout {
  /** The width of one column of the grid. */
  columnWidth: number;
  /** The diameter of a friend's avatar. */
  avatarSize: number;
}

/**
 * The size of the Streaks-All grid's columns and avatars on a screen `screenWidth` wide:
 * `STREAK_GRID_COLUMNS` columns share the room inside the screen's side margin
 * (`spacing.lg`), and an avatar is `STREAK_AVATAR_SHARE` of its column. Written once, for
 * the screen, its tiles and its loading skeleton.
 */
export function getStreakGridLayout(screenWidth: number): StreakGridLayout {
  const columnWidth = (screenWidth - spacing.lg * 2) / STREAK_GRID_COLUMNS;

  return { columnWidth, avatarSize: Math.floor(columnWidth * STREAK_AVATAR_SHARE) };
}
