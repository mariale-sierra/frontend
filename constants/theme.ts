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

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const colors = {
  primary: '#EEFF5C', // neon lime — main brand color. Spotlight, not a surface.
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
  paper: '#F3F2E2', // primary text on dark backgrounds / light-theme background
  success: '#37E0A4',
  warning: '#F2A93B', // no confirmed use case yet — see Open Items Tracker
  error: '#DE2B2B',
  rest: '#B49BFF', // rest/recovery states — positive/neutral, not a problem
  neutral: '#8A8C82', // paused/inactive states — positive/neutral, not a problem
} as const;

export type Colors = typeof colors;
export type ColorToken = keyof Colors;

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
