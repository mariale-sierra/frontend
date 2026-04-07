// Design System Theme
// Fitness social app - React Native (Expo)

export const colors = {
  // Backgrounds
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  surfaceHighlight: '#3C3C3E',

  // Primary (for buttons, CTAs, highlights)
  primary: '#FFFFFF',

  // Text colors (flat structure)
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textInverse: '#000000',

  // Border color
  border: '#3C3C3E',

  // Activity Type Colors - 6 categories for physical activities
  // Used for activity badges, card borders, icons, gradients
  activityType: {
    strength: '#FE5716',      // Red - Strength training
    cardioIntense: '#FDB900', // Orange - Cardio-Intense/Endurance
    flexibility: '#26E6FE',   // Blue/Cyan - Flexibility/Mobility
    cardioLow: '#4DE36C',     // Green - Cardio-Low stress
    mindBody: '#F578EC',      // Pink - Mind-body Training
    functional: '#E4FE18',    // Yellow - Functional/Full-body Training
  },

  // Semantic colors
  success: '#4ADE80',
  error: '#EF4444',
  warning: '#FACC15',
} as const;

// Helper to create gradient from activity type to black background
// Used for challenge detail screen headers
export function getActivityGradient(activityType: keyof typeof colors.activityType): [string, string] {
  return [colors.activityType[activityType], colors.background];
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 18,
  '2xl': 24,
} as const;

export const typography = {
  // Titles
  title: {
    fontSize: 28,
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

  // Headers
  header: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    lineHeight: 24,
  },
  headerSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    lineHeight: 20,
  },

  // Body text
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },

  // Labels & captions
  label: {
    fontSize: 12,
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

  // Numbers (for stats/counters)
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

// Gradient definitions with start/end coordinates
export const gradients = {
  // Surface gradient - diagonal from top-left to bottom-right
  surface: {
    colors: [colors.surfaceHighlight, colors.surface] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  // Surface reverse gradient - diagonal from top-right to bottom-left
  surfaceReverse: {
    colors: [colors.surface, colors.surfaceHighlight] as const,
    start: { x: 1, y: 0 },
    end: { x: 0, y: 1 },
  },
  // Surface vertical gradient - top to bottom
  surfaceVertical: {
    colors: [colors.surfaceHighlight, colors.surface] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  gradients,
} as const;

export type Theme = typeof theme;
export type Colors = typeof colors;
export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type ActivityType = keyof typeof colors.activityType;
