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
  success: '#4ADE80',
  error: '#EF4444',
  warning: '#FACC15',
} as const;

export function getActivityGradient(activityType: keyof typeof colors.activityType): [string, string] {
  return [colors.activityType[activityType], colors.background];
}

export type ActivityType = keyof typeof colors.activityType;
export type Colors = typeof colors;
