import { CATEGORY_CODE_TO_ACTIVITY, CATEGORY_TO_ACTIVITY } from '../../constants/challengeFilters';
import type { ActivityType } from '../../types/activity';
import type {
  ExerciseEntry,
  ExerciseMetrics,
  MetricFieldDefinition,
  RoutineCatalogExerciseContract,
  RoutineContract,
  RoutineExerciseContract,
  RoutineExerciseSetContract,
  RoutineExerciseTargetContract,
  RoutineSummary,
  SchemaMetricValue,
  SetRow,
} from '../../types/routine';

function toFiniteNumber(value: unknown): number | null {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getPrimaryCategory(exercise: RoutineCatalogExerciseContract | null | undefined) {
  const categoryMaps = exercise?.category_maps ?? [];
  return (
    categoryMaps.find((map) => map.isPrimary === true || map.is_primary === true)?.category ??
    categoryMaps[0]?.category ??
    null
  );
}

function getActivityType(exercise: RoutineCatalogExerciseContract | null | undefined): ActivityType {
  const category = getPrimaryCategory(exercise);
  const categoryCode = category?.code?.trim().toLowerCase();
  if (categoryCode && CATEGORY_CODE_TO_ACTIVITY[categoryCode]) {
    return CATEGORY_CODE_TO_ACTIVITY[categoryCode];
  }

  const categoryName = category?.name?.trim().toLowerCase();
  const matchingName = Object.entries(CATEGORY_TO_ACTIVITY).find(
    ([name]) => name.toLowerCase() === categoryName,
  );
  return matchingName?.[1] ?? 'strength';
}

function getLocation(exercise: RoutineCatalogExerciseContract | null | undefined): string {
  return (exercise?.location_maps ?? [])
    .map((map) => map.location?.name?.trim())
    .filter((name): name is string => Boolean(name))
    .join(' / ');
}

function getTargetCode(target: RoutineExerciseTargetContract): string | null {
  const code = target.metricType?.code?.trim();
  return code || null;
}

function getTargetNumber(target: RoutineExerciseTargetContract): number | null {
  const values = [
    target.target_value_int,
    target.target_value_decimal,
    target.target_value_seconds,
  ];

  for (const value of values) {
    if (value == null) continue;
    const numberValue = toFiniteNumber(value);
    if (numberValue != null) return numberValue;
  }

  return null;
}

function getMetricValueType(target: RoutineExerciseTargetContract): string | undefined {
  return target.metricType?.valueType ?? target.metricType?.value_type;
}

function getDurationValue(seconds: number): { minutes: number; seconds: number } {
  const safeSeconds = Math.max(0, Math.round(seconds));
  return {
    minutes: Math.floor(safeSeconds / 60),
    seconds: safeSeconds % 60,
  };
}

function mapStrengthMetrics(sets: RoutineExerciseSetContract[]): ExerciseMetrics {
  const mappedSets: SetRow[] = sets
    .map((set, index) => {
      const repsTarget = (set.targets ?? []).find((target) => getTargetCode(target) === 'reps');
      return {
        setNumber: set.set_number ?? index + 1,
        reps: Math.max(0, Math.round(getTargetNumber(repsTarget ?? {}) ?? 0)),
        restMin: Math.floor(Math.max(0, Math.round(toFiniteNumber(set.rest_seconds_after) ?? 0)) / 60),
        restSec: Math.max(0, Math.round(toFiniteNumber(set.rest_seconds_after) ?? 0)) % 60,
      };
    })
    .sort((a, b) => a.setNumber - b.setNumber);

  return {
    kind: 'strength',
    sets: mappedSets.length > 0
      ? mappedSets
      : [{ setNumber: 1, reps: 0, restMin: 0, restSec: 0 }],
  };
}

function mapSchemaMetrics(
  routineId: number,
  exercise: RoutineCatalogExerciseContract | null | undefined,
  targets: RoutineExerciseTargetContract[],
): ExerciseMetrics {
  const fields: MetricFieldDefinition[] = [];
  const values: Record<string, SchemaMetricValue> = {};
  const seenCodes = new Set<string>();

  for (const target of targets) {
    const code = getTargetCode(target);
    const numberValue = getTargetNumber(target);
    if (!code || numberValue == null || seenCodes.has(code)) continue;

    seenCodes.add(code);
    const valueType = getMetricValueType(target);
    if (valueType === 'text' || valueType === 'boolean') continue;

    if (valueType === 'seconds' || target.target_value_seconds != null) {
      const duration = getDurationValue(numberValue);
      fields.push({
        key: code,
        label: target.metricType?.name ?? code,
        type: 'duration',
        defaultMinutes: duration.minutes,
        defaultSeconds: duration.seconds,
      });
      values[code] = duration;
      continue;
    }

    fields.push({
      key: code,
      label: target.metricType?.name ?? code,
      type: 'number',
      defaultValue: numberValue,
      unit: target.metricType?.defaultUnit ?? target.metricType?.default_unit ?? undefined,
    });
    values[code] = numberValue;
  }

  return {
    kind: 'schema',
    template: {
      id: `routine-${routineId}-${exercise?.id ?? 'exercise'}-metrics`,
      title: fields[0]?.label ?? exercise?.name ?? 'Exercise metrics',
      fields,
    },
    values,
  };
}

function mapExercise(
  routineId: number,
  routineExercise: RoutineExerciseContract,
  index: number,
): ExerciseEntry {
  const exercise = routineExercise.exercise;
  const exerciseId = exercise?.id ?? routineExercise.exerciseId ?? routineExercise.exercise_id;
  const sets = routineExercise.sets ?? [];
  const metricType = sets.length > 0 || exercise?.tracking_mode === 'sets' ? 'strength' : 'schema';

  return {
    id: `routine-${routineId}-exercise-${routineExercise.id ?? index}`,
    name: exercise?.name ?? routineExercise.name ?? `Exercise ${index + 1}`,
    location: getLocation(exercise),
    metricType,
    activityType: getActivityType(exercise),
    muscleGroups: [],
    metrics: metricType === 'strength'
      ? mapStrengthMetrics(sets)
      : mapSchemaMetrics(routineId, exercise, routineExercise.targets ?? []),
    note: routineExercise.notes ?? '',
    backendExerciseId: exerciseId,
    imageUrl: exercise?.icon_url ?? null,
  };
}

export function adaptRoutineContract(contract: RoutineContract): RoutineSummary {
  const exercises = [...(contract.routine_exercises ?? contract.exercises ?? [])]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((routineExercise, index) => mapExercise(contract.id, routineExercise, index));

  const activityCounts = new Map<ActivityType, number>();
  for (const exercise of exercises) {
    activityCounts.set(exercise.activityType, (activityCounts.get(exercise.activityType) ?? 0) + 1);
  }

  const activityTypes = [...activityCounts.keys()];
  const primaryActivity = activityTypes.length > 0
    ? activityTypes.sort((a, b) => (activityCounts.get(b) ?? 0) - (activityCounts.get(a) ?? 0))[0]
    : null;

  return {
    id: `backend-routine-${contract.id}`,
    name: contract.name,
    description: contract.description ?? '',
    isRestDay: false,
    exercises,
    primaryActivity,
    activityTypes,
    backendId: contract.id,
  };
}

export function adaptRoutineContracts(contracts: RoutineContract[]): RoutineSummary[] {
  return contracts.map(adaptRoutineContract);
}
