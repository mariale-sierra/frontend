// ============================================================================
// LEGACY THEME — pre design-system-refactor tokens.
//
// This file is a reference snapshot only, consolidated from the old
// `constants/theme/` directory (colors.ts, typography.ts, spacing.ts,
// radius.ts, shadows.ts, gradients.ts, index.ts) as of the start of the
// `refactor/design-system` branch. Nothing in the app should import from
// this file going forward — `constants/theme.ts` is the live source of
// truth. Keep this around only until every screen has been migrated to the
// new system and confirmed working, then delete it.
//
// See havit-design-system-SKILL.md → "Migrating from the old theme.ts" for
// the specific old→new key collisions to watch for while migrating
// (e.g. `spacing.md`/`spacing.lg` exist in both scales with different
// pixel values and will NOT throw a type error).
// ============================================================================

// ---------------------------------------------------------------------------
// colors.ts
// ---------------------------------------------------------------------------

export const colors = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  surfaceHighlight: '#3C3C3E',
  surfaceAccent: '#7C7C7E',
  primary: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textInverse: '#000000',
  border: '#3C3C3E',
  activityType: {
    strength: '#FE5716',
    cardioIntense: '#FDB900',
    flexibility: '#26E6FE',
    cardioLow: '#4DE36C',
    mindBody: '#F578EC',
    functional: '#E4FE18',
  },
  restDay: '#7EB5D1',
  restDayNeon: '#9B91FF',
  success: '#4ADE80',
  error: '#EF4444',
  warning: '#FACC15',
  streakGlow: '#FF8A00',
} as const;

export function getActivityGradient(activityType: keyof typeof colors.activityType): [string, string] {
  return [colors.activityType[activityType], colors.background];
}

export type ActivityType = keyof typeof colors.activityType;
export type Colors = typeof colors;

// ---------------------------------------------------------------------------
// typography.ts
// ---------------------------------------------------------------------------

export const typography = {
  title: {
    fontSize: 30,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    lineHeight: 34,
  },
  titleLarge: {
    fontSize: 48,
    fontWeight: '700' as const,
    letterSpacing: -1,
    lineHeight: 52,
  },
  header: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    lineHeight: 24,
  },
  headerSmall: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    lineHeight: 20,
  },
  body: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    lineHeight: 16,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  stat: {
    fontSize: 64,
    fontWeight: '700' as const,
    fontStyle: 'italic' as const,
    lineHeight: 64,
  },
  statSmall: {
    fontSize: 32,
    fontWeight: '700' as const,
    fontStyle: 'italic' as const,
    lineHeight: 36,
  },
} as const;

// ---------------------------------------------------------------------------
// spacing.ts
// ---------------------------------------------------------------------------

export const spacing = {
  xxxs: 1,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 26,
  xl: 32,
  '2xl': 48,
} as const;

export type Spacing = keyof typeof spacing;

// ---------------------------------------------------------------------------
// radius.ts
// ---------------------------------------------------------------------------

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 18,
  '2xl': 24,
} as const;

export type Radius = keyof typeof radius;

// ---------------------------------------------------------------------------
// shadows.ts
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// gradients.ts
// ---------------------------------------------------------------------------

export const gradients = {
  surface: {
    colors: [colors.surfaceHighlight, colors.surface] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  surfaceReverse: {
    colors: [colors.surface, colors.surfaceHighlight] as const,
    start: { x: 1, y: 0 },
    end: { x: 0, y: 1 },
  },
  surfaceVertical: {
    colors: [colors.surfaceHighlight, colors.surface] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  restDay: {
    colors: ['#14384ef6', '#a1a7b3'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  surfaceHorizontal: {
    colors: [colors.surface, '#131315'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  metricsBridge: {
    colors: [colors.background, colors.surface, colors.surfaceHighlight] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
} as const;

// ---------------------------------------------------------------------------
// index.ts
// ---------------------------------------------------------------------------

export const legacyTheme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  gradients,
} as const;

export type LegacyTheme = typeof legacyTheme;
