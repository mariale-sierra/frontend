import { create } from 'zustand';
import type { WorkoutSubstitutionPayload } from '../types/challenge';

/** One exercise swap the user chose for a location (B7). */
export interface ChosenSubstitute {
  originalExerciseId: number;
  originalName: string;
  substituteExerciseId: number;
  substituteName: string;
}

/**
 * The user's own "I'm training somewhere else" choice for one challenge's
 * routine. Lives only on this device until the progress is submitted (the
 * backend then stores it on the user's workout log); it NEVER edits the shared
 * routine. Tied to a routine id so it can't be applied to another day.
 */
export interface WorkoutAdaptation {
  routineId: number;
  locationCode: string;
  locationName: string;
  substitutions: ChosenSubstitute[];
}

interface WorkoutAdaptationState {
  byChallenge: Record<string, WorkoutAdaptation>;
  setAdaptation: (challengeId: string, adaptation: WorkoutAdaptation) => void;
  clearAdaptation: (challengeId: string) => void;
}

export const useWorkoutAdaptationStore = create<WorkoutAdaptationState>((set) => ({
  byChallenge: {},
  setAdaptation: (challengeId, adaptation) =>
    set((state) => ({ byChallenge: { ...state.byChallenge, [challengeId]: adaptation } })),
  clearAdaptation: (challengeId) =>
    set((state) => {
      if (!(challengeId in state.byChallenge)) return state;
      const { [challengeId]: _removed, ...rest } = state.byChallenge;
      return { byChallenge: rest };
    }),
}));

/** The adaptation for a challenge only if it was made for this very routine. */
export function adaptationForRoutine(
  adaptation: WorkoutAdaptation | undefined,
  routineId: number | null | undefined,
): WorkoutAdaptation | null {
  return adaptation && routineId != null && adaptation.routineId === routineId ? adaptation : null;
}

/** "10:12,11:13" — the substitutions query param of GET /routine/today/:id. */
export function toSubstitutionsParam(adaptation: WorkoutAdaptation): string {
  return adaptation.substitutions.map((s) => `${s.originalExerciseId}:${s.substituteExerciseId}`).join(',');
}

/** The substitutions body field of POST /workout-logs/progress. */
export function toSubstitutionPayload(adaptation: WorkoutAdaptation): WorkoutSubstitutionPayload[] {
  return adaptation.substitutions.map((s) => ({
    originalExerciseId: s.originalExerciseId,
    substituteExerciseId: s.substituteExerciseId,
  }));
}
