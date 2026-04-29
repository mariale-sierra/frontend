import { colors } from './colors';

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
  metricsBridge: {
    colors: [colors.background, colors.surface, colors.surfaceHighlight] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
} as const;
