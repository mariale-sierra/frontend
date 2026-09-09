import type { ActivityType } from './activity';

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
  /** Backend catalog id, present for routines hydrated from the API. */
  backendExerciseId?: number;
  /** Thumbnail shown on the routine builder's own exercise card. Optional —
   * the store's seed/mock routines predate real exercise images and carry
   * none. */
  imageUrl?: string | null;
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
  id: number | string;
  exerciseId?: number;
  exercise_id?: number;
  order_index?: number;
  notes?: string | null;
  name?: string;
  exercise?: RoutineCatalogExerciseContract | null;
  sets?: RoutineExerciseSetContract[];
  targets?: RoutineExerciseTargetContract[];
  [key: string]: unknown;
}

export interface RoutineCatalogExerciseContract {
  id?: number;
  name?: string;
  tracking_mode?: string;
  icon_url?: string | null;
  category_maps?: RoutineExerciseCategoryMapContract[];
  location_maps?: RoutineExerciseLocationMapContract[];
  [key: string]: unknown;
}

export interface RoutineExerciseCategoryMapContract {
  isPrimary?: boolean;
  is_primary?: boolean;
  category?: { code?: string; name?: string } | null;
}

export interface RoutineExerciseLocationMapContract {
  isPrimary?: boolean;
  is_primary?: boolean;
  location?: { code?: string; name?: string } | null;
}

export interface RoutineMetricTypeContract {
  id?: number;
  code?: string;
  name?: string;
  valueType?: string;
  value_type?: string;
  defaultUnit?: string | null;
  default_unit?: string | null;
}

export interface RoutineExerciseTargetContract {
  id?: string;
  metric_type_id?: number;
  metricType?: RoutineMetricTypeContract | null;
  target_value_int?: number | string | null;
  target_value_decimal?: number | string | null;
  target_value_seconds?: number | string | null;
  target_value_text?: string | null;
  target_value_boolean?: boolean | null;
}

export interface RoutineExerciseSetContract {
  id?: string;
  set_number?: number;
  rest_seconds_after?: number | string | null;
  targets?: RoutineExerciseTargetContract[];
}

export interface RoutineContract {
  id: number;
  name: string;
  description?: string | null;
  createdByUserId?: string;
  is_active?: boolean;
  routine_exercises?: RoutineExerciseContract[];
  exercises?: RoutineExerciseContract[];
  [key: string]: unknown;
}

export interface CreateRoutineRequest {
  name: string;
  description?: string;
  // The backend derives the creator from the JWT (`req.user.sub`) — never send
  // `createdByUserId`, the server ignores it if present.
  is_active?: boolean;
}

/** Mirrors backend AddRoutineExerciseTargetDto — `metric_type_id` is the
 * numeric metric_types.id (resolve via GET /metrics), not the string code. */
export interface RoutineExerciseTargetPayload {
  metric_type_id: number;
  value: number;
}

/** Mirrors backend AddRoutineExerciseSetDto. `reps` is a shortcut the
 * backend expands into a 'reps' target itself — no metric_type_id lookup
 * needed for it. */
export interface RoutineExerciseSetPayload {
  set_number: number;
  reps?: number;
  rest_seconds_after?: number;
  targets?: RoutineExerciseTargetPayload[];
}

export interface AddExerciseToRoutineRequest {
  exerciseId: number;
  sets?: RoutineExerciseSetPayload[];
  targets?: RoutineExerciseTargetPayload[];
}
