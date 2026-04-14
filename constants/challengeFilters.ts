import type { ActivityType } from './theme';

export type FilterMode = 'location' | 'category' | null;

export const CATEGORY_TO_ACTIVITY: Record<string, ActivityType> = {
  Strength: 'strength',
  'Cardio Intense': 'cardioIntense',
  'Cardio Low': 'cardioLow',
  Flexibility: 'flexibility',
  'Mind-Body': 'mindBody',
  Functional: 'functional',
};

export const EXERCISE_FILTERS: ReadonlyArray<{ key: Exclude<FilterMode, null>; label: string }> = [
  { key: 'location', label: 'BY LOCATION' },
  { key: 'category', label: 'BY CATEGORY' },
];
