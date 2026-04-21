import { ActivityType } from '../constants/theme';
import type { LocationType } from '../components/icons/locationIcon';

export const PREDEFINED_ACTIVITY_CATEGORIES = [
  'Strength',
  'Cardio Intense',
  'Cardio Low',
  'Flexibility',
  'Mind-Body',
  'Functional',
] as const;

export type ActivityCategory = (typeof PREDEFINED_ACTIVITY_CATEGORIES)[number];

export const PREDEFINED_LOCATIONS: LocationType[] = [
  'gym',
  'home',
  'outdoor',
  'studio',
  'anywhere',
];

export interface ChallengeOption {
  id: string;
  label: string;
  activityCategories: ActivityCategory[];
  locations: LocationType[];
}

export interface ExerciseMetricsRow {
  set: number;
  reps: string;
  lbs: string;
}

export interface ExerciseMetricsBlock {
  id: string;
  name: string;
  activityType: ActivityType;
  location: LocationType;
  notes: string;
  restTimeLabel?: string;
  rows: ExerciseMetricsRow[];
}

export type MetricField = 'reps' | 'lbs';
