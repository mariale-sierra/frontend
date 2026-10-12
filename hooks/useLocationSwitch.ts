import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getExerciseAlternatives,
  getLocationAvailability,
  type ExerciseAlternative,
  type LocationAvailability,
} from '../services/exercises/exercises.service';
import type { ChosenSubstitute, WorkoutAdaptation } from '../store/workoutAdaptationStore';

export interface RoutineExerciseRef {
  exerciseId: number;
  name: string;
}

/** One exercise of the routine that does not work at the chosen location. */
export interface SubstitutionItem {
  exerciseId: number;
  name: string;
  /** null while loading. An empty list means: no compatible alternative. */
  alternatives: ExerciseAlternative[] | null;
  /** Picked alternative; null = stays as the routine wrote it. */
  chosenId: number | null;
  failed: boolean;
}

interface Options {
  visible: boolean;
  routineId: number | null;
  exercises: RoutineExerciseRef[];
  current: WorkoutAdaptation | null;
}

/**
 * State machine behind the "change location" sheet. Always derives from the
 * routine's ORIGINAL exercises, so changing location several times never
 * compounds substitutions: each pick starts clean (or from the saved choice
 * when re-opening the same location).
 */
export function useLocationSwitch({ visible, routineId, exercises, current }: Options) {
  const [locations, setLocations] = useState<LocationAvailability[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<LocationAvailability | null>(null);
  const [items, setItems] = useState<SubstitutionItem[]>([]);
  // A slow response for a location the user has already left must not overwrite
  // the newer one.
  const requestRef = useRef(0);

  const exerciseKey = exercises.map((e) => e.exerciseId).join(',');

  useEffect(() => {
    if (!visible) return;
    setSelected(null);
    setItems([]);
    setLoadError(false);
    if (exercises.length === 0) {
      setLocations([]);
      return;
    }
    let cancelled = false;
    setLocations(null);
    getLocationAvailability(exercises.map((e) => e.exerciseId))
      .then((result) => {
        if (!cancelled) setLocations(result);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, exerciseKey]);

  const selectLocation = useCallback(
    (location: LocationAvailability) => {
      const requestId = ++requestRef.current;
      setSelected(location);
      const unsupported = exercises.filter((e) => location.unsupportedExerciseIds.includes(e.exerciseId));
      const previous = current?.locationCode === location.code ? current.substitutions : [];
      setItems(
        unsupported.map((e) => ({ exerciseId: e.exerciseId, name: e.name, alternatives: null, chosenId: null, failed: false })),
      );
      const allIds = exercises.map((e) => e.exerciseId);
      unsupported.forEach((exercise) => {
        getExerciseAlternatives(
          exercise.exerciseId,
          location.code,
          allIds.filter((id) => id !== exercise.exerciseId),
        )
          .then((result) => {
            if (requestRef.current !== requestId) return;
            const saved = previous.find((s) => s.originalExerciseId === exercise.exerciseId);
            const preferred =
              result.alternatives.find((a) => a.id === saved?.substituteExerciseId) ?? result.alternatives[0] ?? null;
            setItems((prev) =>
              prev.map((item) =>
                item.exerciseId === exercise.exerciseId
                  ? { ...item, alternatives: result.alternatives, chosenId: preferred?.id ?? null }
                  : item,
              ),
            );
          })
          .catch(() => {
            if (requestRef.current !== requestId) return;
            setItems((prev) =>
              prev.map((item) =>
                item.exerciseId === exercise.exerciseId ? { ...item, alternatives: [], failed: true } : item,
              ),
            );
          });
      });
    },
    [exercises, current],
  );

  const choose = useCallback((exerciseId: number, alternativeId: number) => {
    setItems((prev) => prev.map((item) => (item.exerciseId === exerciseId ? { ...item, chosenId: alternativeId } : item)));
  }, []);

  const backToLocations = useCallback(() => {
    requestRef.current += 1;
    setSelected(null);
    setItems([]);
  }, []);

  const loading = items.some((item) => item.alternatives === null);
  /** Exercises that stay as written because nothing compatible exists there. */
  const withoutAlternatives = items.filter((item) => item.alternatives !== null && item.alternatives.length === 0);
  const canApply = selected !== null && routineId != null && !loading;

  const buildAdaptation = useCallback((): WorkoutAdaptation | null => {
    if (!selected || routineId == null || loading) return null;
    const substitutions: ChosenSubstitute[] = [];
    for (const item of items) {
      const alternative = item.alternatives?.find((a) => a.id === item.chosenId);
      if (!alternative) continue;
      substitutions.push({
        originalExerciseId: item.exerciseId,
        originalName: item.name,
        substituteExerciseId: alternative.id,
        substituteName: alternative.name,
      });
    }
    return { routineId, locationCode: selected.code, locationName: selected.name, substitutions };
  }, [selected, routineId, loading, items]);

  return {
    locations,
    loadError,
    selected,
    items,
    loading,
    withoutAlternatives,
    canApply,
    selectLocation,
    choose,
    backToLocations,
    buildAdaptation,
  };
}
