// ============================================================================
// Havit Design System — theme.ts
//
// Single source of truth for design tokens: colors, typography, spacing,
// radius, shadows. Values and rules come from havit-design-system-SKILL.md —
// read that file before adding to or changing anything here.
//
// No inline hex values or magic numbers anywhere else in the app once a
// screen/component has been migrated — every value should reference a token
// from this file.
//
// The previous token set lives in `theme.legacy.ts` as a reference only.
// Nothing should import from that file.
// ============================================================================

import type { ActivityType } from '../types/activity';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const colors = {
  // Warm off-white — swapped values with `paper` on explicit request (was
  // pure #FFFFFF, `paper` was #F3F2E2). `primary` was lime (#EEFF5C) until
  // the Activity Color System v2 pass retired that in favor of per-challenge
  // activity colors (see `activityColors` below) — this is now the neutral
  // chrome accent for anything with NO challenge association (nav FAB,
  // active tab, streak badges, "See all" links, generic buttons/CTAs outside
  // a challenge's own scoped UI). See havit-design-system-SKILL.md →
  // Activity Color System v2 for the full rationale and migration status
  // before touching challenge-scoped colors.
  primary: '#F3F2E2',
  secondary: '#FF5C1A', // orange — secondary buttons, in-progress indicators
  accent: '#EF3B66', // pink — social/community moments only, never a status color
  // Screen background. The wireframes literally specify `#0E0F0B` (matched
  // exactly at first) — deepened to `#080906` on explicit user request: same
  // hue/saturation (~75° olive-green, ~15%), lightness taken from ~5.1% down
  // to ~3% so it reads as a deep near-black instead of "a gray with a green
  // tint." Keep the hue/saturation if this ever needs adjusting again — only
  // lightness was the complaint.
  ink: '#080906',
  surface: '#191A13', // elevated surface (cards, nav, tab tracks) — confirmed correct as-is, don't touch
  paper: '#FFFFFF', // primary text on dark backgrounds / light-theme background — swapped with `primary`, see note above
  success: '#4ADE80', // test tweak — was #37E0A4 → #1E9E70 → #4ADE80 → #76EAA0 → back to #4ADE80 (current), a brighter teal-green originally
  warning: '#FB923C', // test tweak — was #F2A93B amber → #C9540F → #FB923C → #F9B176 → back to #FB923C (current). Still no confirmed use case — see Open Items Tracker
  error: '#EF4444', // test tweak — was #DE2B2B → #A31E1E → #EF4444 → #F67575 → back to #EF4444 (current)
  rest: '#B399FF', // test tweak — was #B49BFF → #B399FF → #C9B6FF → back to #B399FF (current), per explicit request each time. Rest/recovery states, day-level only — "no activity today". Never a whole challenge's identity color, even for a mostly-rest-day challenge.
  neutral: '#8A8C82', // paused/inactive states — positive/neutral, not a problem
} as const;

export type Colors = typeof colors;
export type ColorToken = keyof Colors;

/**
 * Per-challenge activity accent colors (Activity Color System v2). Each
 * challenge has exactly one dominant activity category — computed
 * backend-side, live, from its exercise composition (see
 * `dominant_activity_category` on `ChallengeContract`) — and that color
 * becomes the challenge's own identity accent within its own scoped UI
 * (its card, its detail/progress screens), substituting for the static
 * `primary` token there. `primary` (white) itself stays for anything with
 * no challenge association. A challenge with no determinable dominant
 * category (e.g. zero exercises yet) falls back to `primary`, not one of
 * these — there is no "neutral" entry in this map on purpose.
 *
 * Each color pairs with `ink` text only — never `paper`/white — per the
 * confirmed 6:1+ contrast pairing.
 */
export const activityColors: Record<ActivityType, string> = {
  strength: '#DEE027', // true lime, slightly more yellow (power/alertness) — was #F2653A → #DEE027 → #E9EB54 → back to #DEE027 (current)
  cardioIntense: '#F0BC33', // golden-orange (fast/electric energy) — was #F0B429 → #F0BC33 → #F7CF64 → back to #F0BC33 (current)
  cardioLow: '#1BDCC4', // aqua-turquoise (steady/calm endurance) — was #5CD97A → #9ADB4F → #1BDCC4 → #43EDD7 → back to #1BDCC4 (current)
  flexibility: '#588AEE', // electric blue (open/breath) — was #3DDBEE → #588AEE → #88ADF6 → back to #588AEE (current)
  mindBody: '#EE58D5', // magenta-pink (calm/balance) — was #F17FE0 → #EE58D5 → #F688E4 → back to #EE58D5 (current)
  functional: '#33BDEB', // sky blue (versatile/utility) — was #D8EE3C → #33BDEB → #63CFF3 → back to #33BDEB (current)
} as const;

/**
 * Text opacity scale — applies to `paper` text on dark surfaces.
 * Only these three values are valid; there is no in-between.
 */
export const textOpacity = {
  primary: 0.85, // headings, values, primary content
  secondary: 0.55, // labels, timestamps, captions, member counts
  tertiary: 0.3, // placeholders, disabled states, least-important text
} as const;

export type TextOpacityToken = keyof typeof textOpacity;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

/**
 * Font family tokens. Loaded via @expo-google-fonts/dm-sans and
 * @expo-google-fonts/bebas-neue (Expo-managed — do not hand-link fonts).
 *
 * NOTE: these packages are not installed yet and no useFonts() wiring exists
 * in app/_layout.tsx as of this file's creation — that's a follow-up step,
 * not silently added here. Until then these family names won't resolve to
 * an actual loaded font and RN will fall back to the system font.
 */
export const fontFamily = {
  display: 'BebasNeue_400Regular', // headings/display ONLY — do not use below `xl` size, illegible at small sizes
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
} as const;

export type FontFamilyToken = keyof typeof fontFamily;

/** DM Sans weights. Use `medium` (500) for emphasis/labels/buttons app-wide — not 600. */
export const fontWeight = {
  regular: '400',
  medium: '500',
  bold: '700',
} as const;

export type FontWeightToken = keyof typeof fontWeight;

/** Numeric size scale, in px. No tier above `3xl` (30) — see Explicitly Rejected Patterns. */
export const fontSize = {
  xs: 12, // captions, timestamps, legal
  sm: 14, // secondary text, labels
  base: 16, // body text (default)
  lg: 18, // emphasized body, subheadings
  xl: 20, // small headings (H3)
  '2xl': 24, // section headings (H2)
  '3xl': 30, // screen titles (H1)
} as const;

/** Line heights, in px, paired 1:1 with the `fontSize` scale by token. */
export const lineHeight = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 26,
  xl: 28,
  '2xl': 32,
  '3xl': 38,
} as const;

export type FontSizeToken = keyof typeof fontSize;

/**
 * Bebas Neue MUST always carry this letter-spacing — not optional, it reads
 * cramped without it. RN's `letterSpacing` style is in px, so derive it from
 * whatever `fontSize` the display text is using (skill spec is 0.02em).
 */
export const BEBAS_LETTER_SPACING_EM = 0.02;

export function bebasLetterSpacing(size: number): number {
  return size * BEBAS_LETTER_SPACING_EM;
}

export const typography = {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  textOpacity,
  bebasLetterSpacing,
} as const;

export type Typography = typeof typography;

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

const SPACING_UNIT = 4;

/** spacing(n) = n * 4px. Prefer this for one-off values outside the named scale below. */
function spacingFn(multiplier: number): number {
  return multiplier * SPACING_UNIT;
}

const spacingScale = {
  xs: spacingFn(1), // 4 — tight spacing, icon-to-label gaps
  sm: spacingFn(2), // 8 — small gaps, compact padding, tag padding
  md: spacingFn(3), // 12 — default gap between related items, compact button/card padding
  base: spacingFn(4), // 16 — standard padding (cards, screen margins)
  lg: spacingFn(6), // 24 — section spacing, hero/CTA card padding
  xl: spacingFn(8), // 32 — spacing between major sections
  '2xl': spacingFn(12), // 48 — large vertical rhythm
  '3xl': spacingFn(16), // 64 — big hero/empty-state spacing
} as const;

/**
 * Spacing token. Callable as `spacing(n)` for `n * 4`px, and also exposes the
 * named scale as properties, e.g. `spacing.base` === `spacing(4)` === 16.
 *
 * MIGRATION NOTE: the legacy scale also has `md`/`lg` keys but with different
 * pixel values (legacy md=16/lg=26 vs. this scale's md=12/lg=24). Swapping a
 * component from the legacy theme to this one will NOT throw a type error for
 * those two keys — it will silently change the rendered spacing. Review every
 * `spacing.md` / `spacing.lg` usage by hand when migrating a screen, don't
 * rely on the compiler to catch it.
 */
export const spacing = Object.assign(spacingFn, spacingScale) as typeof spacingFn & typeof spacingScale;

export type SpacingToken = keyof typeof spacingScale;

/** DO NOT use a spacing value outside this scale. Legacy px values map onto it as: */
export const RETIRED_SPACING_MAP = {
  14: spacing.md, // 12
  20: spacing.lg, // 24
  10: spacing.sm, // 8
  6: spacing.xs, // 4
} as const;

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------

export const radius = {
  none: 0,
  small: 8, // tags/badges, image/photo tiles — ALWAYS this for photo grid tiles, regardless of context
  medium: 16, // list-row cards, small icon buttons
  big: 28, // hero cards, primary buttons, nav bar, FAB, segmented control track
} as const;

export type RadiusToken = keyof typeof radius;

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------

/** shadowColor is always #000 regardless of level. sm = subtle lift, md = default elevation, lg = max elevation. */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

export type ShadowToken = keyof typeof shadows;

// ---------------------------------------------------------------------------
// Combined theme
// ---------------------------------------------------------------------------

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} as const;

export type Theme = typeof theme;
