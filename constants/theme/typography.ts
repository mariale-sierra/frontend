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
