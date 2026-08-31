import type {
  ChallengeVisibility,
  CreateChallengeExercisePayload,
  CreateChallengePayload,
} from '../../types/challenge';
import type {
  ExerciseEntry,
  ExerciseMetrics,
  RoutineSummary,
  SchemaMetricValue,
  SetRow,
} from '../../types/routine';

interface BuildChallengePayloadParams {
  title: string;
  description: string;
  visibility: ChallengeVisibility;
  cycleLengthDays: number;
  cyclesCount: number;
  selectedCategories: string[];
  selectedLocations: string[];
  routinesByDay: Record<number, RoutineSummary>;
}

function mapStrengthSet(set: SetRow) {
  return {
    set_number: set.setNumber,
    reps: set.reps,
    rest_seconds: set.restMin * 60 + set.restSec,
  };
}

function mapSchemaValue(value: SchemaMetricValue) {
  if (typeof value === 'number') {
    return value;
  }

  return {
    minutes: value.minutes,
    seconds: value.seconds,
  };
}

function mapExerciseMetrics(metrics: ExerciseMetrics) {
  if (metrics.kind === 'strength') {
    return {
      kind: 'strength' as const,
      sets: metrics.sets.map(mapStrengthSet),
    };
  }

  return {
    kind: 'schema' as const,
    template_id: metrics.template.id,
    values: Object.fromEntries(
      Object.entries(metrics.values).map(([key, value]) => [key, mapSchemaValue(value)]),
    ),
  };
}

function mapExercise(exercise: ExerciseEntry): CreateChallengeExercisePayload {
  return {
    name: exercise.name,
    location: exercise.location,
    metric_type: exercise.metricType,
    activity_type: exercise.activityType,
    muscle_groups: exercise.muscleGroups,
    note: exercise.note.trim() || undefined,
    metrics: mapExerciseMetrics(exercise.metrics),
  };
}

/**
 * Builds the `POST /challenges` payload from builder-store state.
 *
 * This is a pure data transformation, not a validation step: `useCreateChallengeFlow`'s
 * `missingConfigurationFields` (built from `getStepErrors`) is the single source of truth
 * for challenge-create validation and gates every caller before this function runs. Don't
 * re-add field-presence checks here — that would reintroduce a second, easy-to-drift copy
 * of the same rules the hook already enforces.
 */
export function buildCreateChallengePayload(
  params: BuildChallengePayloadParams,
): CreateChallengePayload {
  const cycleDays = Array.from({ length: params.cycleLengthDays }, (_, index) => index + 1);

  return {
    name: params.title.trim(),
    description: params.description.trim() || undefined,
    visibility: params.visibility.toLowerCase() as Lowercase<ChallengeVisibility>,
    duration_days: params.cycleLengthDays * params.cyclesCount,
    cycle_length_days: params.cycleLengthDays,
    categories: params.selectedCategories,
    locations: params.selectedLocations,
    cycle_days: cycleDays.map((dayNumber) => {
      const routine = params.routinesByDay[dayNumber] as RoutineSummary;
      const isRestDay = routine.isRestDay;

      return {
        day_number: dayNumber,
        is_rest_day: isRestDay,
        routine_name: routine.name,
        routine_description: routine.description,
        exercises: isRestDay ? [] : routine.exercises.map(mapExercise),
      };
    }),
  };
}
