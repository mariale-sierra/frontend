import type { ActivityType } from '../constants/theme';

export interface RoutineOption {
  id: number;
  name: string;
}

export type ExerciseMetricType = 'strength' | 'schema';

type MetricFieldBase = {
  key: string;
  label: string;
};

export type NumberMetricField = MetricFieldBase & {
  type: 'number';
  defaultValue: number;
  unit?: string;
  min?: number;
  max?: number;
};

export type DurationMetricField = MetricFieldBase & {
  type: 'duration';
  defaultMinutes: number;
  defaultSeconds: number;
};

export type MetricFieldDefinition = NumberMetricField | DurationMetricField;

export interface MetricTemplate {
  id: string;
  title: string;
  fields: MetricFieldDefinition[];
}

export interface SetRow {
  setNumber: number;
  reps: number;
  restMin: number;
  restSec: number;
}

export type SchemaMetricValue = number | { minutes: number; seconds: number };

export type ExerciseMetrics =
  | { kind: 'strength'; sets: SetRow[] }
  | {
      kind: 'schema';
      template: MetricTemplate;
      values: Record<string, SchemaMetricValue>;
    };

export interface ExerciseEntry {
  id: string;
  name: string;
  location: string;
  metricType: ExerciseMetricType;
  activityType: ActivityType;
  muscleGroups: string[];
  metrics: ExerciseMetrics;
  note: string;
}

export interface RoutineSummary {
  id: string;
  name: string;
  description: string;
  isRestDay: boolean;
  exercises: ExerciseEntry[];
  primaryActivity: ActivityType | null;
  activityTypes: ActivityType[];
  backendId?: number;
}

export interface RoutineExerciseContract {
  id: number;
  exerciseId?: number;
  name?: string;
  [key: string]: unknown;
}

export interface RoutineContract {
  id: number;
  name: string;
  description?: string | null;
  createdByUserId?: string;
  is_active?: boolean;
  exercises?: RoutineExerciseContract[];
  [key: string]: unknown;
}

export interface CreateRoutineRequest {
  name: string;
  description?: string;
  createdByUserId?: string;
  is_active?: boolean;
}

export interface AddExerciseToRoutineRequest {
  exerciseId: number;
}
