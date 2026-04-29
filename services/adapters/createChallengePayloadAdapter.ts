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
  challengeDuration: number;
  cycleDuration: number;
  selectedCategories: string[];
  selectedLocations: string[];
  routinesByDay: Record<number, RoutineSummary>;
}

type BuildPayloadResult =
  | { ok: true; payload: CreateChallengePayload }
  | { ok: false; errors: string[] };

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

export function buildCreateChallengePayload(
  params: BuildChallengePayloadParams,
): BuildPayloadResult {
  const errors: string[] = [];

  if (params.title.trim().length === 0) {
    errors.push('Challenge name is required.');
  }
  if (params.cycleDuration <= 0) {
    errors.push('Cycle duration must be greater than zero.');
  }
  if (params.challengeDuration <= 0) {
    errors.push('Challenge duration must be greater than zero.');
  }

  const cycleDays = Array.from({ length: params.cycleDuration }, (_, index) => index + 1);
  const missingDays = cycleDays.filter((day) => !params.routinesByDay[day]);
  if (missingDays.length > 0) {
    errors.push(`Every cycle day needs a routine. Missing: ${missingDays.join(', ')}`);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const payload: CreateChallengePayload = {
    name: params.title.trim(),
    description: params.description.trim() || undefined,
    visibility: params.visibility.toLowerCase() as Lowercase<ChallengeVisibility>,
    duration_days: params.challengeDuration,
    cycle_length_days: params.cycleDuration,
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

  return { ok: true, payload };
}
