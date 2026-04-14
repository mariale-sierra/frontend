import { create } from 'zustand';
import type { ActivityType } from '../constants/theme';

export type ExerciseMetricType = 'strength' | 'distance' | 'duration' | 'distance-duration';

export interface SetRow {
  setNumber: number;
  reps: number;
  restMin: number;
  restSec: number;
}

export type ExerciseMetrics =
  | { kind: 'strength'; sets: SetRow[] }
  | { kind: 'distance'; distanceKm: number }
  | { kind: 'duration'; durationMin: number; durationSec: number }
  | { kind: 'distance-duration'; distanceKm: number; durationMin: number; durationSec: number };

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
}

interface RoutineBuilderState {
  dayIndex: number | null;
  routineName: string;
  routineDescription: string;
  isRestDay: boolean;
  exercises: ExerciseEntry[];
  savedRoutines: RoutineSummary[];
  routinesByDay: Record<number, RoutineSummary>;

  init: (day: number, routine?: RoutineSummary | null) => void;
  setRoutineName: (name: string) => void;
  setRoutineDescription: (description: string) => void;
  setIsRestDay: (value: boolean) => void;
  addExercise: (exercise: Omit<ExerciseEntry, 'metrics' | 'note'>) => void;
  updateStrengthSet: (exerciseId: string, setIndex: number, patch: Partial<SetRow>) => void;
  addStrengthSet: (exerciseId: string) => void;
  removeStrengthSet: (exerciseId: string, setIndex: number) => void;
  updateExerciseMetrics: (exerciseId: string, patch: Partial<Extract<ExerciseMetrics, { kind: 'distance' | 'duration' | 'distance-duration' }>>) => void;
  reorderExercise: (from: number, to: number) => void;
  setNote: (exerciseId: string, note: string) => void;
  removeExercise: (exerciseId: string) => void;
  saveCurrentRoutineToDay: () => RoutineSummary | null;
  assignRoutineToDay: (day: number, routine: RoutineSummary) => void;
  assignRestDayToDay: (day: number) => void;
  resetBuilder: () => void;
}

const defaultSet = (): SetRow => ({
  setNumber: 1,
  reps: 8,
  restMin: 1,
  restSec: 0,
});

function createDefaultMetrics(metricType: ExerciseMetricType): ExerciseMetrics {
  switch (metricType) {
    case 'strength':
      return { kind: 'strength', sets: [defaultSet()] };
    case 'distance':
      return { kind: 'distance', distanceKm: 5 };
    case 'duration':
      return { kind: 'duration', durationMin: 20, durationSec: 0 };
    case 'distance-duration':
      return { kind: 'distance-duration', distanceKm: 5, durationMin: 25, durationSec: 0 };
  }
}

function cloneExercise(exercise: ExerciseEntry): ExerciseEntry {
  return {
    ...exercise,
    metrics: JSON.parse(JSON.stringify(exercise.metrics)) as ExerciseMetrics,
  };
}

function buildRoutineSummary(id: string, name: string, description: string, isRestDay: boolean, exercises: ExerciseEntry[]): RoutineSummary {
  return {
    id,
    name,
    description,
    isRestDay,
    exercises: exercises.map(cloneExercise),
    primaryActivity: isRestDay ? null : getPrimaryActivityType(exercises),
    activityTypes: isRestDay ? [] : getUniqueActivityTypes(exercises),
  };
}

export function getPrimaryActivityType(exercises: ExerciseEntry[]): ActivityType | null {
  if (exercises.length === 0) return null;
  const counts: Partial<Record<ActivityType, number>> = {};
  for (const exercise of exercises) {
    counts[exercise.activityType] = (counts[exercise.activityType] ?? 0) + 1;
  }
  return (Object.entries(counts) as [ActivityType, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
}

export function getUniqueActivityTypes(exercises: ExerciseEntry[]): ActivityType[] {
  return Array.from(new Set(exercises.map((exercise) => exercise.activityType)));
}

export function getRoutineLocationSummary(exercises: ExerciseEntry[]): string {
  const locations = Array.from(
    new Set(
      exercises
        .flatMap((exercise) => exercise.location.split('/'))
        .map((location) => location.trim())
        .filter(Boolean)
    )
  );

  return locations.join('/');
}

const seedRoutine = buildRoutineSummary(
  'seed-leg-day',
  'Leg Day for Glute Growth',
  'Lower-body focus with glutes first, then posterior-chain finishers.',
  false,
  [
    {
      id: 'seed-1',
      name: 'BULGARIAN DEADLIFTS',
      location: 'Home / Outdoor',
      metricType: 'strength',
      activityType: 'strength',
      muscleGroups: ['Glutes', 'Legs', 'Back'],
      metrics: { kind: 'strength', sets: [{ setNumber: 1, reps: 10, restMin: 1, restSec: 30 }] },
      note: '',
    },
    {
      id: 'seed-2',
      name: 'HIP THRUST',
      location: 'Gym',
      metricType: 'strength',
      activityType: 'strength',
      muscleGroups: ['Glutes'],
      metrics: { kind: 'strength', sets: [{ setNumber: 1, reps: 12, restMin: 1, restSec: 30 }] },
      note: '',
    },
  ]
);

export const useRoutineBuilder = create<RoutineBuilderState>((set, get) => ({
  dayIndex: null,
  routineName: '',
  routineDescription: '',
  isRestDay: false,
  exercises: [],
  savedRoutines: [seedRoutine],
  routinesByDay: {},

  init: (day, routine) => {
    const assignedRoutine = get().routinesByDay[day];
    const source = routine ?? assignedRoutine ?? null;
    if (!source) {
      set({
        dayIndex: day,
        routineName: '',
        routineDescription: '',
        isRestDay: false,
        exercises: [],
      });
      return;
    }

    set({
      dayIndex: day,
      routineName: source.name,
      routineDescription: source.description,
      isRestDay: source.isRestDay,
      exercises: source.exercises.map(cloneExercise),
    });
  },

  setRoutineName: (name) => set({ routineName: name }),

  setRoutineDescription: (routineDescription) => set({ routineDescription }),

  setIsRestDay: (isRestDay) => set({ isRestDay }),

  addExercise: (exercise) =>
    set((state) => ({
      isRestDay: false,
      exercises: [
        ...state.exercises,
        {
          ...exercise,
          metrics: createDefaultMetrics(exercise.metricType),
          note: '',
        },
      ],
    })),

  updateStrengthSet: (exerciseId, setIndex, patch) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) => {
        if (exercise.id !== exerciseId || exercise.metrics.kind !== 'strength') {
          return exercise;
        }

        return {
          ...exercise,
          metrics: {
            kind: 'strength',
            sets: exercise.metrics.sets.map((row, index) => (
              index === setIndex ? { ...row, ...patch } : row
            )),
          },
        };
      }),
    })),

  addStrengthSet: (exerciseId) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) => {
        if (exercise.id !== exerciseId || exercise.metrics.kind !== 'strength') {
          return exercise;
        }

        return {
          ...exercise,
          metrics: {
            kind: 'strength',
            sets: [
              ...exercise.metrics.sets,
              { ...defaultSet(), setNumber: exercise.metrics.sets.length + 1 },
            ],
          },
        };
      }),
    })),

  removeStrengthSet: (exerciseId, setIndex) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) => {
        if (exercise.id !== exerciseId || exercise.metrics.kind !== 'strength') {
          return exercise;
        }

        return {
          ...exercise,
          metrics: {
            kind: 'strength',
            sets: exercise.metrics.sets
              .filter((_, index) => index !== setIndex)
              .map((row, index) => ({ ...row, setNumber: index + 1 })),
          },
        };
      }),
    })),

  updateExerciseMetrics: (exerciseId, patch) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) => {
        if (exercise.id !== exerciseId || exercise.metrics.kind === 'strength') {
          return exercise;
        }

        return {
          ...exercise,
          metrics: {
            ...exercise.metrics,
            ...patch,
          } as ExerciseMetrics,
        };
      }),
    })),

  reorderExercise: (from, to) =>
    set((state) => {
      const nextExercises = [...state.exercises];
      const [movedExercise] = nextExercises.splice(from, 1);
      nextExercises.splice(to, 0, movedExercise);
      return { exercises: nextExercises };
    }),

  setNote: (exerciseId, note) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) => (
        exercise.id !== exerciseId ? exercise : { ...exercise, note }
      )),
    })),

  removeExercise: (exerciseId) =>
    set((state) => ({
      exercises: state.exercises.filter((exercise) => exercise.id !== exerciseId),
    })),

  saveCurrentRoutineToDay: () => {
    const state = get();
    if (state.dayIndex == null) {
      return null;
    }

    const routineName = state.isRestDay ? 'Rest Day' : state.routineName.trim() || `Day ${state.dayIndex} Routine`;
    const routineDescription = state.isRestDay
      ? state.routineDescription.trim() || 'Recovery, mobility, or complete rest.'
      : state.routineDescription.trim();

    const routine = buildRoutineSummary(
      state.isRestDay ? `rest-day-${state.dayIndex}` : `${routineName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      routineName,
      routineDescription,
      state.isRestDay,
      state.exercises
    );

    set((currentState) => {
      const nextSavedRoutines = routine.isRestDay
        ? currentState.savedRoutines
        : [
            routine,
            ...currentState.savedRoutines.filter((item) => item.name.toLowerCase() !== routine.name.toLowerCase()),
          ];

      return {
        routinesByDay: {
          ...currentState.routinesByDay,
          [state.dayIndex as number]: routine,
        },
        savedRoutines: nextSavedRoutines,
      };
    });

    return routine;
  },

  assignRoutineToDay: (day, routine) =>
    set((state) => ({
      routinesByDay: {
        ...state.routinesByDay,
        [day]: buildRoutineSummary(routine.id, routine.name, routine.description, routine.isRestDay, routine.exercises),
      },
    })),

  assignRestDayToDay: (day) =>
    set((state) => ({
      routinesByDay: {
        ...state.routinesByDay,
        [day]: buildRoutineSummary(
          `rest-day-${day}`,
          'Rest Day',
          'Recovery, mobility, or complete rest.',
          true,
          []
        ),
      },
    })),

  resetBuilder: () => set({
    dayIndex: null,
    routineName: '',
    routineDescription: '',
    isRestDay: false,
    exercises: [],
  }),
}));