import { CATEGORY_TO_ACTIVITY } from '../../constants/challengeFilters';
import {
  PREDEFINED_ACTIVITY_CATEGORIES,
  PREDEFINED_LOCATIONS,
} from '../../types/metrics';
import type {
  ActivityCategory,
  ChallengeOption,
  ExerciseMetricsBlock,
} from '../../types/metrics';
import type { LocationType } from '../../components/icons/locationIcon';
import type { ChallengeContract, TodayRoutineContract } from '../../types/challenge';
import type { ActivityType } from '../../constants/theme';
import { asNumber, asString } from './adapterUtils';

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

export function sanitizeChallengeOptions(challenges: ChallengeOption[]): ChallengeOption[] {
  return challenges.map((challenge) => ({
    ...challenge,
    activityCategories: sanitizeCategories(challenge.activityCategories),
    locations: sanitizeLocations(challenge.locations),
  }));
}

export function adaptChallengesForMetrics(contracts: ChallengeContract[]): ChallengeOption[] {
  return contracts.map((contract) => ({
    id: String(contract.id),
    label: asString(contract.name),
    activityCategories: sanitizeCategories(
      Array.isArray(contract.categories) ? contract.categories : [],
    ),
    locations: sanitizeLocations(
      Array.isArray(contract.locations) ? contract.locations : [],
    ),
  }));
}

function restLabel(restSeconds: number | null): string {
  if (!restSeconds) return 'Rest 60 sec';
  const mins = Math.floor(restSeconds / 60);
  const secs = restSeconds % 60;
  if (mins > 0 && secs > 0) return `Rest ${mins}m ${secs}s`;
  if (mins > 0) return `Rest ${mins} min`;
  return `Rest ${restSeconds} sec`;
}

export function adaptTodayRoutineExercises(
  contract: TodayRoutineContract,
  challenge: ChallengeOption,
): ExerciseMetricsBlock[] {
  const rawExercises = contract.exercises ?? [];

  return rawExercises
    .map((ex) => {
      const exerciseId = asNumber(ex.id);
      if (exerciseId === null) return null;

      const name = asString(ex.name);
      const activityType = (asString(ex.activity_type) || 'strength') as ActivityType;
      const location = asString(ex.location) as LocationType;
      const sets = Array.isArray(ex.sets) ? ex.sets : [];
      const setCount = sets.length > 0 ? sets.length : 3;
      const firstRest = asNumber(sets[0]?.rest_seconds ?? null);

      return {
        id: String(exerciseId),
        exerciseId,
        name,
        activityType,
        location: ALLOWED_LOCATIONS.has(location) ? location : ('anywhere' as LocationType),
        notes: '',
        restTimeLabel: restLabel(firstRest),
        rows: Array.from({ length: setCount }, (_, i) => ({
          set: i + 1,
          reps: '',
          lbs: '',
        })),
      } satisfies ExerciseMetricsBlock;
    })
    .filter((block): block is ExerciseMetricsBlock => block !== null);
}

export function sanitizeHydratedExercises(
  exerciseMetrics: ExerciseMetricsBlock[],
  selectedChallenge: ChallengeOption | undefined,
): ExerciseMetricsBlock[] {
  return exerciseMetrics
    .filter(
      (exercise) =>
        ALLOWED_LOCATIONS.has(exercise.location) &&
        selectedChallenge?.locations.includes(exercise.location),
    )
    .map((exercise) => ({
      ...exercise,
      exerciseId: exercise.exerciseId ?? 0,
      notes: exercise.notes ?? '',
      restTimeLabel: exercise.restTimeLabel ?? 'Rest 60 sec',
    }));
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
