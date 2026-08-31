import api from '../api';
import type {
  AddExerciseToRoutineRequest,
  CreateRoutineRequest,
  ExerciseMetrics,
  RoutineContract,
  RoutineExerciseSetPayload,
  RoutineExerciseTargetPayload,
  SchemaMetricValue,
} from '../../types/routine';

export async function createRoutine(data: CreateRoutineRequest) {
  const response = await api.post<RoutineContract>('/routine', data);
  return response.data;
}

function schemaValueToNumber(value: SchemaMetricValue): number {
  return typeof value === 'number' ? value : value.minutes * 60 + value.seconds;
}

/** Converts a routine-builder exercise's local `ExerciseMetrics` into the
 * sets[]/targets[] POST /routine/:id/exercises now actually persists (backend
 * fix 2026-08-29 — previously only { exerciseId } was ever sent, so every
 * Sets/Reps/Rest/schema value the Routine Creator collected had nowhere to
 * save). A 'strength' exercise's reps go through the backend's `reps`
 * shortcut on each set (no metric_type_id needed for it); a 'schema'
 * exercise's fields become exercise-level targets, keyed by `metricCodeToId`
 * (from GET /metrics) since the backend wants a numeric metric_type_id, not
 * the string code the schema template uses as its field key. A field whose
 * code has no matching metric_type_id is skipped rather than guessed. */
export function buildRoutineExercisePersistence(
  metrics: ExerciseMetrics,
  metricCodeToId: Record<string, number>,
): { sets?: RoutineExerciseSetPayload[]; targets?: RoutineExerciseTargetPayload[] } {
  if (metrics.kind === 'strength') {
    return {
      sets: metrics.sets.map((set) => ({
        set_number: set.setNumber,
        reps: set.reps,
        rest_seconds_after: set.restMin * 60 + set.restSec,
      })),
    };
  }

  const targets: RoutineExerciseTargetPayload[] = [];
  for (const field of metrics.template.fields) {
    const metricTypeId = metricCodeToId[field.key];
    const rawValue = metrics.values[field.key];
    if (metricTypeId == null || rawValue === undefined) continue;
    targets.push({ metric_type_id: metricTypeId, value: schemaValueToNumber(rawValue) });
  }

  return targets.length > 0 ? { targets } : {};
}

export async function addExerciseToRoutine(
  routineId: number,
  exerciseId: number,
  persistence?: { sets?: RoutineExerciseSetPayload[]; targets?: RoutineExerciseTargetPayload[] },
) {
  const payload: AddExerciseToRoutineRequest = { exerciseId, ...persistence };
  const response = await api.post<RoutineContract>(`/routine/${routineId}/exercises`, payload);
  return response.data;
}

export async function getRoutines() {
  const response = await api.get<RoutineContract[]>('/routine');
  return response.data;
}

export async function getRoutine(id: number) {
  const response = await api.get<RoutineContract>(`/routine/${id}`);
  return response.data;
}
