/**
 * The Streaks-All grid (`app/home/streaks.tsx`): three friends to a row, each an avatar
 * that is a true circle (`UserAvatar`'s `circle`) and as big as its column allows —
 * bigger than the 64px, four-to-a-row tiles it began with (2026-09-20, explicit request:
 * 'in a row three circles should fit, not more. they need to be bigger').
 */
export const STREAK_GRID_COLUMNS = 3;

/** How wide the avatar is, as a share of its column's width; the rest is air between
 * neighbors. */
export const STREAK_AVATAR_SHARE = 0.8;
