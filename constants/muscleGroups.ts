// temporary data mock, when connected to backend this will be replaced by actual exercise data

export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Core',
  'Glutes',
  'Legs',
  'Full Body',
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];
