import { CATEGORY_TO_ACTIVITY } from '../../constants/challengeFilters';
import {
  PREDEFINED_ACTIVITY_CATEGORIES,
  PREDEFINED_LOCATIONS,
} from '../../types/metrics';
import type {
  ActivityCategory,
  ActivityMetricConfig,
  ChallengeOption,
  ExerciseMetricsBlock,
  ExerciseMetricsRow,
  MetricField,
} from '../../types/metrics';
import { ACTIVITY_METRIC_CONFIG } from '../../types/metrics';
import type { LocationType } from '../../components/icons/locationIcon';
import type { ChallengeContract, ChallengePhoto, TodayRoutineContract } from '../../types/challenge';
import type { ActivityType } from '../../types/activity';
import { asString } from './adapterUtils';
import { pickChallengeStatus, pickDominantActivityCategory } from './challengeState';
import { pickCurrentDay, pickIsRestDay } from './homeAdapter';

const ALLOWED_ACTIVITY_CATEGORIES = new Set<ActivityCategory>(
  PREDEFINED_ACTIVITY_CATEGORIES,
);
const ALLOWED_LOCATIONS = new Set<LocationType>(PREDEFINED_LOCATIONS);

function sanitizeCategories(categories: unknown[]): ActivityCategory[] {
  return (categories as string[]).filter((value): value is ActivityCategory =>
    ALLOWED_ACTIVITY_CATEGORIES.has(value as ActivityCategory),
  );
}

function sanitizeLocations(locations: unknown[]): LocationType[] {
  return (locations as string[]).filter((value): value is LocationType =>
    ALLOWED_LOCATIONS.has(value as LocationType),
  );
}

/** Log-today's-progress bottom sheet — one row per active challenge that
 * can actually receive a log today (rest days and already-logged-today
 * challenges excluded, see below). */
export interface LogChallengeQuickPick {
  id: string;
  name: string;
  currentDay: number;
  /** From the same `GET /workout-posts/mine` grouping the challenge cards
   * already use (challengeState.ts's groupLatestPhotoByChallengeId) — this
   * user's own latest photo for the challenge, or null if they haven't
   * posted one yet. */
  photoUrl: string | null;
  /** Activity Color System v2 — this challenge's own dominant activity
   * category (`null` if it has none yet). Resolve via `challengeState.ts`'s
   * `getChallengeAccentColor()` for the row's "Day N" label. */
  dominantActivityCategory: ActivityType | null;
}

/** Real day number (already attached server-side to `GET /users/me/challenges`,
 * see homeAdapter.ts) — deliberately NOT a routine name, which that endpoint
 * doesn't return per challenge (only `GET /routine/today/:challengeId`,
 * per-challenge, would — an N+1 fetch this list can't afford). See the
 * design system skill's Open Items Tracker for the backend gap.
 *
 * Rest-day challenges are excluded entirely, not just visually de-emphasized
 * — there's nothing to log on a rest day, so it's not a valid quick-pick
 * target at all. Same for a challenge whose TODAY already has a logged
 * photo (this user's own latest photo's `.day` matches today's cycle day,
 * the same "completed" check `deriveChallengeCardState()` uses) — logging
 * again would just be a second entry for a day that's already done. */
export function getLogChallengeQuickPicks(
  challenges: ChallengeContract[],
  latestPhotoByChallengeId: Map<string, ChallengePhoto>,
): LogChallengeQuickPick[] {
  return challenges
    .filter((challenge) => {
      if (pickChallengeStatus(challenge) !== 'active') return false;
      if (pickIsRestDay(challenge)) return false;
      const currentDay = pickCurrentDay(challenge);
      const latestPhotoDay = latestPhotoByChallengeId.get(String(challenge.id))?.day ?? null;
      if (latestPhotoDay != null && latestPhotoDay === currentDay) return false;
      return true;
    })
    .map((challenge) => ({
      id: String(challenge.id),
      name: asString(challenge.name) || 'Challenge',
      currentDay: pickCurrentDay(challenge),
      photoUrl: latestPhotoByChallengeId.get(String(challenge.id))?.imageUrl ?? null,
      dominantActivityCategory: pickDominantActivityCategory(challenge),
    }));
}

export function sanitizeChallengeOptions(challenges: ChallengeOption[]): ChallengeOption[] {
  return challenges.map((challenge) => ({
    ...challenge,
    activityCategories: sanitizeCategories(challenge.activityCategories),
    locations: sanitizeLocations(challenge.locations),
  }));
}

export function adaptChallengesForMetrics(contracts: ChallengeContract[]): ChallengeOption[] {
  console.log('[adaptChallengesForMetrics] input', contracts);
  const result = contracts.map((contract) => ({
    id: String(contract.id),
    label: asString(contract.name),
    activityCategories: sanitizeCategories(
      Array.isArray(contract.categories) ? contract.categories : [],
    ),
    locations: sanitizeLocations(
      Array.isArray(contract.locations) ? contract.locations : [],
    ),
  }));
  console.log('[adaptChallengesForMetrics] output', result);
  return result;
}

function restLabel(restSeconds: number | null): string {
  if (!restSeconds) return 'Rest 60 sec';
  const mins = Math.floor(restSeconds / 60);
  const secs = restSeconds % 60;
  if (mins > 0 && secs > 0) return `Rest ${mins}m ${secs}s`;
  if (mins > 0) return `Rest ${mins} min`;
  return `Rest ${restSeconds} sec`;
}

/** Parses ids that the backend sends as strings (Postgres BIGINT is serialized
 * as a string) as well as plain numbers. asNumber() only accepts `number`, so
 * it silently dropped every routine exercise (id came as "1") — that was why
 * the metrics screen showed "No exercises for today's routine". */
function toNum(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** GET /routine/today/:id returns raw RoutineExercise rows, whose metric targets
 * (sets[].targets[].metricType.code / targets[].metricType.code) tell us what
 * the exercise actually tracks. Map those codes onto the activity type whose
 * ACTIVITY_METRIC_CONFIG surfaces the matching columns, so e.g. a duration-only
 * exercise shows a duration field instead of reps/lbs. */
function activityTypeFromMetricCodes(codes: string[]): ActivityType {
  const set = new Set(codes);
  // Real backend metric_type codes are 'distance'/'time', not the assumed
  // 'distanceKm'/'duration' from the old seed file — those never matched
  // anything, so every cardio/flexibility exercise silently fell through to
  // the 'strength' default below. Fixed 2026-08-28, see havit-design-system-SKILL.md.
  if (set.has('distance')) return 'cardioIntense'; // time + distance
  if (set.has('reps') || set.has('weight')) return 'strength'; // reps + lbs
  if (set.has('time')) return 'flexibility'; // time only
  return 'strength';
}

// Maps a routine_exercise_(set_)target's metric_type code onto the
// MetricField the Log-Metrics stepper screen edits. 'rounds' has no matching
// backend metric_type (see applyExerciseMetrics.ts), so it never gets a real
// target and always falls back to an empty/synthetic row.
const METRIC_CODE_TO_FIELD: Record<string, MetricField> = {
  reps: 'reps',
  weight: 'lbs',
  distance: 'distance',
  time: 'duration',
};

interface TodayRoutineTarget {
  metricType?: { code?: string } | null;
  target_value_int?: number | string | null;
  target_value_decimal?: number | string | null;
  target_value_seconds?: number | string | null;
}
interface TodayRoutineSet {
  rest_seconds_after?: number | null;
  targets?: TodayRoutineTarget[] | null;
}
interface TodayRoutineExerciseRow {
  id?: number | string;
  notes?: string | null;
  exercise?: { id?: number | string; name?: string } | null;
  sets?: TodayRoutineSet[] | null;
  targets?: TodayRoutineTarget[] | null;
}

/** Reads the one target-value column that actually applies for this target's
 * metric type — reps is a plain int, weight/distance are decimals, duration
 * is stored in whole seconds (metric_types.duration has value_type='seconds'). */
function extractTargetValue(target: TodayRoutineTarget): number | null {
  const code = target.metricType?.code;
  if (!code) return null;
  if (code === 'reps') return toNum(target.target_value_int);
  if (code === 'weight' || code === 'distance') return toNum(target.target_value_decimal);
  if (code === 'time') return toNum(target.target_value_seconds);
  return null;
}

/** Reads every target on a list (a set's own targets, or an exercise-level
 * fallback target) into a {field: value} map, keyed by MetricField. */
function targetsToFieldMap(targets: TodayRoutineTarget[] | null | undefined): Partial<Record<MetricField, number>> {
  const result: Partial<Record<MetricField, number>> = {};
  for (const target of targets ?? []) {
    const code = target.metricType?.code;
    const field = code ? METRIC_CODE_TO_FIELD[code] : undefined;
    if (!field) continue;
    const value = extractTargetValue(target);
    if (value !== null) result[field] = value;
  }
  return result;
}

export function adaptTodayRoutineExercises(
  contract: TodayRoutineContract,
  challenge: ChallengeOption,
): ExerciseMetricsBlock[] {
  const rawExercises = (contract.exercises ?? []) as TodayRoutineExerciseRow[];

  console.log('[adaptTodayRoutineExercises] Input:', contract, challenge);

  return rawExercises
    .map((ex): ExerciseMetricsBlock | null => {
      // The backend nests the catalog exercise under `exercise`; `ex.id` is the
      // routine-exercise row id. Prefer the real exercise id for the payload.
      const exerciseId = toNum(ex.exercise?.id) ?? toNum(ex.id);
      if (exerciseId === null) return null;

      const name = asString(ex.exercise?.name);
      const sets = Array.isArray(ex.sets) ? ex.sets : [];

      const metricCodes: string[] = [];
      for (const set of sets) {
        for (const target of set.targets ?? []) {
          const code = target.metricType?.code;
          if (code) metricCodes.push(code);
        }
      }
      for (const target of ex.targets ?? []) {
        const code = target.metricType?.code;
        if (code) metricCodes.push(code);
      }

      const activityType = activityTypeFromMetricCodes(metricCodes);
      // Per-exercise location isn't returned by this endpoint; default to a
      // valid value so sanitizeHydratedExercises keeps the row.
      const location = 'anywhere' as LocationType;
      const firstRest = toNum(sets[0]?.rest_seconds_after ?? null);

      const config: ActivityMetricConfig = ACTIVITY_METRIC_CONFIG[activityType] ?? ACTIVITY_METRIC_CONFIG.strength;
      // Exercise-level targets (re.targets) are the fallback for a column a
      // set doesn't carry its own target for — some exercises only ever get
      // a target at the exercise level, not per set.
      const exerciseTargets = targetsToFieldMap(ex.targets);

      // Real per-set rows when the routine actually has RoutineExerciseSet
      // rows (the normal case for anything built via the Routine Creator);
      // otherwise fall back to synthetic empty rows, same as before.
      const rows: ExerciseMetricsRow[] =
        sets.length > 0
          ? sets.map((set, i) => {
              const setTargets = { ...exerciseTargets, ...targetsToFieldMap(set.targets) };
              const row: ExerciseMetricsRow = { set: i + 1, targets: setTargets };
              for (const col of config.columns) {
                const target = setTargets[col.key];
                row[col.key] = target !== undefined ? String(target) : '';
              }
              return row;
            })
          : Array.from({ length: config.defaultRows }, (_, i) => {
              const row: ExerciseMetricsRow = { set: i + 1, targets: exerciseTargets };
              for (const col of config.columns) {
                const target = exerciseTargets[col.key];
                row[col.key] = target !== undefined ? String(target) : '';
              }
              return row;
            });

      return {
        id: String(ex.id ?? exerciseId),
        exerciseId,
        name,
        activityType,
        location,
        notes: asString(ex.notes),
        restTimeLabel: restLabel(firstRest) ?? 'Rest 60 sec',
        rows,
      } satisfies ExerciseMetricsBlock;
    })
    .filter((block): block is ExerciseMetricsBlock => block !== null);
}

export function sanitizeHydratedExercises(
  exerciseMetrics: ExerciseMetricsBlock[],
  _selectedChallenge: ChallengeOption | undefined,
): ExerciseMetricsBlock[] {
  // Exercises come from /routine/today/:id — already scoped to the challenge.
  // Only validate that each exercise has a known location value.
  return exerciseMetrics
    .filter((exercise) => ALLOWED_LOCATIONS.has(exercise.location))
    .map((exercise) => ({
      ...exercise,
      exerciseId: exercise.exerciseId ?? 0,
      notes: exercise.notes ?? '',
      restTimeLabel: exercise.restTimeLabel ?? 'Rest 60 sec',
    }));
}

/** How many of an exercise's sets have at least one field pushed away from
 * its plan target — shared by the Log-Metrics exercise card (per-exercise
 * "N/total" meta + completion indicator) and the screen's own footer count
 * (summed across every exercise), so the two can't drift apart. */
export function countAdjustedSets(exercise: ExerciseMetricsBlock): number {
  const config = ACTIVITY_METRIC_CONFIG[exercise.activityType] ?? ACTIVITY_METRIC_CONFIG.strength;
  return exercise.rows.filter((row) =>
    config.columns.some((col) => {
      const target = row.targets?.[col.key];
      if (target === undefined) return false;
      return Number(row[col.key] ?? target) !== target;
    }),
  ).length;
}

export function getDefaultMetricsSeed() {
  return {
    challenges: [] as ChallengeOption[],
    selectedChallengeId: '',
    exerciseMetrics: [] as ExerciseMetricsBlock[],
  };
}

// Kept for reference — maps category label to activityType used by filters.
// The actual exercise list now comes from the backend, not a local catalog.
export { CATEGORY_TO_ACTIVITY };
