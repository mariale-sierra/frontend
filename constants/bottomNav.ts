// Centralized geometry + animation tuning for the bottom navigation bar
// (app/(tabs)/_layout.tsx + components/navigation/*). Every magic number
// the nav capsule, the sliding indicator, and the separate FAB need to stay
// in sync with each other lives here — nothing is re-typed per file, so
// they can never silently drift out of alignment.
import { ReduceMotion, type WithSpringConfig } from 'react-native-reanimated';
import { spacing } from './theme';

export const BOTTOM_NAV_TAB_COUNT = 4;

/** Height shared by both the nav capsule and the FAB — deliberately equal,
 * per explicit "should read as visual siblings, not one dominant over the
 * other" request (unlike the old design, where the FAB rose well above the
 * bar via a large negative margin). */
export const BOTTOM_NAV_HEIGHT = 52;

/** True circle at BOTTOM_NAV_HEIGHT — same "fixed-diameter circle via
 * size/2" exception this file's sibling constant (FAB_SIZE, in
 * app/(tabs)/_layout.tsx) already documents. */
export const BOTTOM_NAV_FAB_SIZE = BOTTOM_NAV_HEIGHT;

/** Screen-edge inset for the whole nav unit (capsule + FAB) — matches the
 * previous single-capsule design's own inset (`spacing.md`). */
export const BOTTOM_NAV_OUTER_MARGIN = spacing.md; // 12

/** Gap between the tab capsule and the separate FAB — small and
 * consistent, per explicit request. */
export const BOTTOM_NAV_CAPSULE_GAP = spacing.sm; // 8

/** Distance from the bottom of the tab bar's own (already safe-area-aware)
 * box to the bottom of both capsules — matches the previous design. */
export const BOTTOM_NAV_BOTTOM_INSET = spacing.lg; // 24

/** Inset of the sliding indicator pill within its own tab slot. */
export const BOTTOM_NAV_INDICATOR_INSET = spacing.xs; // 4

/**
 * Derives the tab-capsule width and per-tab slot width from the current
 * screen width. Both the decorative background (the capsule shape + the
 * sliding indicator) and the real touchable item widths (`tabBarItemStyle`
 * per screen) read from this same function, so a tap target and the
 * indicator drawn behind it can never disagree about where a tab actually
 * is — see components/navigation/README notes in each consumer file.
 */
export function getBottomNavGeometry(screenWidth: number) {
  const navCapsuleWidth = Math.max(
    screenWidth - BOTTOM_NAV_OUTER_MARGIN * 2 - BOTTOM_NAV_CAPSULE_GAP - BOTTOM_NAV_FAB_SIZE,
    0,
  );
  const tabSlotWidth = navCapsuleWidth / BOTTOM_NAV_TAB_COUNT;

  return { navCapsuleWidth, tabSlotWidth };
}

// Spring tuning — fast, physical, very little overshoot ("premium", not
// "bouncy"). `ReduceMotion.System` makes every spring built from this
// config collapse to an instant/near-instant transition automatically
// when the OS-level Reduce Motion setting is on, with no bespoke
// reduced-motion branching needed anywhere else in this feature.
export const BOTTOM_NAV_INDICATOR_SPRING: WithSpringConfig = {
  damping: 22,
  stiffness: 260,
  mass: 0.7,
  reduceMotion: ReduceMotion.System,
};

export const BOTTOM_NAV_PRESS_SPRING: WithSpringConfig = {
  damping: 18,
  stiffness: 320,
  mass: 0.5,
  reduceMotion: ReduceMotion.System,
};

export const BOTTOM_NAV_BREATHE_SPRING: WithSpringConfig = {
  damping: 16,
  stiffness: 220,
  reduceMotion: ReduceMotion.System,
};

export const BOTTOM_NAV_STRETCH_SETTLE_SPRING: WithSpringConfig = {
  damping: 14,
  stiffness: 180,
  reduceMotion: ReduceMotion.System,
};

export const BOTTOM_NAV_COLOR_DURATION_MS = 180;

// "Breathe" expansion while the bar is actively being pressed — very
// subtle, per explicit "casi subconsciente" (almost subconscious) request.
export const BOTTOM_NAV_BREATHE_SCALE_X = 1.015;
export const BOTTOM_NAV_BREATHE_SCALE_Y = 1.04;

// Indicator travel deformation while it's sliding between tabs — subtle
// "mass/inertia" cue, not a gelatin wobble.
export const BOTTOM_NAV_TRAVEL_SCALE_X = 1.08;
export const BOTTOM_NAV_TRAVEL_SCALE_Y = 0.94;
export const BOTTOM_NAV_TRAVEL_STRETCH_DURATION_MS = 80;

// Press-down feedback scale for a tab item / the FAB.
export const BOTTOM_NAV_TAB_PRESS_SCALE = 0.96;
export const BOTTOM_NAV_FAB_PRESS_SCALE = 0.95;
