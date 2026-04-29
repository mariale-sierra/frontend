export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 18,
  '2xl': 24,
} as const;

export type Radius = keyof typeof radius;
