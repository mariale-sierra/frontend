import { colors } from './colors';
import { gradients } from './gradients';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export { colors, getActivityGradient, type ActivityType, type Colors } from './colors';
export { spacing, type Spacing } from './spacing';
export { radius, type Radius } from './radius';
export { typography } from './typography';
export { shadows } from './shadows';
export { gradients } from './gradients';

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  gradients,
} as const;

export type Theme = typeof theme;
