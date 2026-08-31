import { create } from 'zustand';
import {
  getDefaultMetricsSeed,
  sanitizeChallengeOptions,
  sanitizeHydratedExercises,
} from '../services/adapters/index';
import type {
  ChallengeOption,
  ExerciseMetricsBlock,
  MetricField,
} from '../types/metrics';

interface MetricsEntryState {
  challenges: ChallengeOption[];
  selectedChallengeId: string;
  exerciseMetrics: ExerciseMetricsBlock[];
  currentRoutineId: number | null;

  setExerciseMetrics: (exercises: ExerciseMetricsBlock[], routineId: number | null) => void;
  updateMetricValue: (exerciseId: string, rowIndex: number, field: MetricField, value: string) => void;

  // Backend handoff: hydrate the screen with API challenge + routine payload.
  hydrateMetricsData: (payload: {
    challenges: ChallengeOption[];
    selectedChallengeId?: string;
    exerciseMetrics: ExerciseMetricsBlock[];
    routineId?: number | null;
  }) => void;
}

const DEFAULT_SEED = getDefaultMetricsSeed();

export const useMetricsEntryStore = create<MetricsEntryState>((set) => ({
  challenges: DEFAULT_SEED.challenges,
  selectedChallengeId: DEFAULT_SEED.selectedChallengeId,
  exerciseMetrics: DEFAULT_SEED.exerciseMetrics,
  currentRoutineId: null,

  setExerciseMetrics: (exercises, routineId) => {
    set({ exerciseMetrics: exercises, currentRoutineId: routineId });
  },

  updateMetricValue: (exerciseId, rowIndex, field, value) => {
    const normalizedValue = value.replace(/[^0-9.]/g, '');

    set((state) => ({
      exerciseMetrics: state.exerciseMetrics.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        return {
          ...exercise,
          rows: exercise.rows.map((row, index) =>
            index === rowIndex ? { ...row, [field]: normalizedValue } : row
          ),
        };
      }),
    }));
  },

  hydrateMetricsData: (payload) => {
    const sanitizedChallenges = sanitizeChallengeOptions(payload.challenges);

    const selectedChallengeId =
      payload.selectedChallengeId ?? sanitizedChallenges[0]?.id ?? '';

    const selectedChallenge =
      sanitizedChallenges.find((challenge) => challenge.id === selectedChallengeId) ??
      sanitizedChallenges[0];

    const hydratedExercises = sanitizeHydratedExercises(
      payload.exerciseMetrics,
      selectedChallenge,
    );

    set({
      challenges: sanitizedChallenges,
      selectedChallengeId,
      exerciseMetrics: hydratedExercises,
      currentRoutineId: payload.routineId ?? null,
    });
  },
}));
