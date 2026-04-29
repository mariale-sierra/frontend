export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 26,
  xl: 32,
  '2xl': 48,
} as const;

export type Spacing = keyof typeof spacing;
