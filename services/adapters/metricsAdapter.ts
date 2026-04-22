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

const ALLOWED_ACTIVITY_CATEGORIES = new Set<ActivityCategory>(
  PREDEFINED_ACTIVITY_CATEGORIES,
);
const ALLOWED_LOCATIONS = new Set<LocationType>(PREDEFINED_LOCATIONS);

type ExerciseTemplate = {
  id: string;
  name: string;
  activityType: ExerciseMetricsBlock['activityType'];
  location: LocationType;
  restTimeLabel: string;
  setCount: number;
};

const MOCK_CHALLENGES: ChallengeOption[] = [
  {
    id: 'c1',
    label: 'placeholder',
    activityCategories: ['Strength'],
    locations: ['gym', 'home'],
  },
  {
    id: 'c2',
    label: 'glute rebuild',
    activityCategories: ['Strength', 'Functional'],
    locations: ['gym', 'home'],
  },
  {
    id: 'c3',
    label: 'upper blast',
    activityCategories: ['Strength'],
    locations: ['gym'],
  },
  {
    id: 'c4',
    label: 'functional week',
    activityCategories: ['Functional', 'Cardio Low'],
    locations: ['anywhere', 'outdoor'],
  },
];

const MOCK_EXERCISE_CATALOG: ExerciseTemplate[] = [
  {
    id: 'ex-1',
    name: 'Bulgarian Deadlifts',
    activityType: 'strength',
    location: 'gym',
    restTimeLabel: 'Rest 90 sec',
    setCount: 3,
  },
  {
    id: 'ex-2',
    name: 'Hip Thrust',
    activityType: 'strength',
    location: 'gym',
    restTimeLabel: 'Rest 120 sec',
    setCount: 4,
  },
  {
    id: 'ex-3',
    name: 'Step Ups',
    activityType: 'functional',
    location: 'home',
    restTimeLabel: 'Rest 75 sec',
    setCount: 3,
  },
  {
    id: 'ex-4',
    name: 'Brisk Incline Walk',
    activityType: 'cardioLow',
    location: 'outdoor',
    restTimeLabel: 'Rest 45 sec',
    setCount: 3,
  },
  {
    id: 'ex-5',
    name: 'Plank Reach Through',
    activityType: 'functional',
    location: 'anywhere',
    restTimeLabel: 'Rest 60 sec',
    setCount: 3,
  },
];

function getInitialRows(setCount: number) {
  return Array.from({ length: setCount }, (_, index) => ({
    set: index + 1,
    reps: '',
    lbs: '',
  }));
}

function sanitizeCategories(categories: string[]): ActivityCategory[] {
  return categories.filter((value): value is ActivityCategory =>
    ALLOWED_ACTIVITY_CATEGORIES.has(value as ActivityCategory),
  );
}

function sanitizeLocations(locations: string[]): LocationType[] {
  return locations.filter((value): value is LocationType =>
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

export function buildExerciseMetrics(challenge: ChallengeOption): ExerciseMetricsBlock[] {
  const allowedActivities = challenge.activityCategories
    .map((category) => CATEGORY_TO_ACTIVITY[category])
    .filter(Boolean);

  return MOCK_EXERCISE_CATALOG.filter(
    (exercise) =>
      allowedActivities.includes(exercise.activityType) &&
      challenge.locations.includes(exercise.location),
  ).map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    activityType: exercise.activityType,
    location: exercise.location,
    notes: '',
    restTimeLabel: exercise.restTimeLabel,
    rows: getInitialRows(exercise.setCount),
  }));
}

export function getDefaultMetricsSeed() {
  const challenges = sanitizeChallengeOptions(MOCK_CHALLENGES);
  const selectedChallengeId = challenges[0]?.id ?? '';
  const selectedChallenge = challenges[0];

  return {
    challenges,
    selectedChallengeId,
    exerciseMetrics: selectedChallenge ? buildExerciseMetrics(selectedChallenge) : [],
  };
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
      notes: exercise.notes ?? '',
      restTimeLabel: exercise.restTimeLabel ?? 'Rest 60 sec',
    }));
}


// CHALLENGE INFO STUFFFFF


export type ChallengeDetail = {
  id: string;
  author: string;
  days: number;
  rules: string[];
  routine: {
    day: number;
    title?: string;
    subtitle?: string;
    rest?: boolean;
  }[];
};

const MOCK_CHALLENGE_DETAILS: Record<string, ChallengeDetail> = {
  c1: {
    id: 'c1',
    author: 'Kristen',
    days: 75,
    rules: [
      'Do 2 workouts every day (no exceptions)',
      'Each workout must be 45 minutes long',
      'One workout must be outdoors',
      'Workouts must be spaced out (not back-to-back)',
      'No rest days — do this every day for 75 days',
    ],
    routine: [
      { day: 1, title: 'Running', subtitle: '10 km running' },
      { day: 2, title: 'Swimming', subtitle: '1 km swimming' },
      { day: 3, title: 'Lifting Weight Routine', subtitle: 'Chest, arms, legs' },
      { day: 4, rest: true },
    ],
  },
};

export function getChallengeDetailById(id: string): ChallengeDetail | undefined {
  return MOCK_CHALLENGE_DETAILS[id];
}