import { ActivityType } from '../types/activity';
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

export type MetricField = 'reps' | 'lbs' | 'duration' | 'distance' | 'rounds';

export interface ExerciseMetricsRow {
  set: number;
  reps?: string;
  lbs?: string;
  duration?: string;
  distance?: string;
  rounds?: string;
  /** Original per-set plan value for whichever fields above have a real
   * backend target (routine_exercise_set_targets), keyed the same way. Seeds
   * the field's initial value and lets the Log-Metrics screen tell an
   * untouched set from an adjusted one. Absent for a field with no target
   * (e.g. no weight target was ever set on this set). */
  targets?: Partial<Record<MetricField, number>>;
}

export interface ExerciseMetricsBlock {
  id: string;
  exerciseId: number;
  name: string;
  activityType: ActivityType;
  location: LocationType;
  notes: string;
  restTimeLabel?: string;
  rows: ExerciseMetricsRow[];
}

export interface ActivityMetricConfig {
  columns: Array<{ key: MetricField; label: string }>;
  defaultRows: number;
  showSetColumn: boolean;
}

// `duration`'s label is `min`, not `sec` — the underlying stored/submitted
// value is still native seconds everywhere else in the app (backend column,
// routine targets, `applyExerciseMetrics.ts`'s submit payload — see that
// file's own doc comment for why seconds end-to-end was a deliberate fix,
// not something to revert). Only `components/add/logMetricsExerciseCard.tsx`
// reads this `label` (for the Log-Metrics stepper), and it converts to/from
// minutes at that one presentation boundary — per explicit "seconds isn't
// intuitive" report, 2026-08-31. `.label` isn't read anywhere else that
// touches duration (`routine/[day].tsx`/`metricsAdapter.ts`/
// `applyExerciseMetrics.ts` all only read `.key`), confirmed via grep before
// changing this shared config.
export const ACTIVITY_METRIC_CONFIG: Record<ActivityType, ActivityMetricConfig> = {
  strength: {
    columns: [{ key: 'reps', label: 'reps' }, { key: 'lbs', label: 'lbs' }],
    defaultRows: 3,
    showSetColumn: true,
  },
  cardioIntense: {
    columns: [{ key: 'duration', label: 'min' }, { key: 'distance', label: 'km' }],
    defaultRows: 1,
    showSetColumn: false,
  },
  cardioLow: {
    columns: [{ key: 'duration', label: 'min' }, { key: 'distance', label: 'km' }],
    defaultRows: 1,
    showSetColumn: false,
  },
  flexibility: {
    columns: [{ key: 'duration', label: 'min' }],
    defaultRows: 1,
    showSetColumn: false,
  },
  mindBody: {
    columns: [{ key: 'duration', label: 'min' }],
    defaultRows: 1,
    showSetColumn: false,
  },
  functional: {
    columns: [{ key: 'rounds', label: 'rounds' }, { key: 'reps', label: 'reps' }],
    defaultRows: 3,
    showSetColumn: true,
  },
};
