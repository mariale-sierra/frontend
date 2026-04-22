import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useMetricsEntryStore } from '../store/metricsEntryStore';
import { getUserId } from '../services/auth.service';
import { getRoutines } from '../services/routine.service';
import { createWorkoutLog, getWorkoutLog } from '../services/workout-log.service';
import { addMetricToWorkoutLogExercise } from '../services/metrics.service';
import type { RoutineOption } from '../components/add/metricsRoutineSelector';

interface WorkoutLogExerciseDTO {
  id: number;
  exercise: { id: number; name: string };
}

interface WorkoutLogDTO {
  id: number;
  exercises?: WorkoutLogExerciseDTO[];
}

export function useMetricsScreen() {
  const challenges = useMetricsEntryStore((state) => state.challenges);
  const selectedChallengeId = useMetricsEntryStore((state) => state.selectedChallengeId);
  const isChallengeMenuOpen = useMetricsEntryStore((state) => state.isChallengeMenuOpen);
  const exerciseMetrics = useMetricsEntryStore((state) => state.exerciseMetrics);

  const toggleChallengeMenu = useMetricsEntryStore((state) => state.toggleChallengeMenu);
  const selectChallenge = useMetricsEntryStore((state) => state.selectChallenge);
  const updateMetricValue = useMetricsEntryStore((state) => state.updateMetricValue);
  const updateExerciseNotes = useMetricsEntryStore((state) => state.updateExerciseNotes);

  const [activeRowKey, setActiveRowKey] = useState<string | null>(null);
  const [routines, setRoutines] = useState<RoutineOption[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(null);
  const [isRoutineMenuOpen, setIsRoutineMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onRowFocus = useCallback((rowKey: string) => {
    setActiveRowKey(rowKey);
  }, []);

  const onRowBlur = useCallback((rowKey: string) => {
    setActiveRowKey((current) => (current === rowKey ? null : current));
  }, []);

  useEffect(() => {
    setActiveRowKey(null);
  }, [selectedChallengeId]);

  useEffect(() => {
    let cancelled = false;

    async function loadRoutines() {
      try {
        const data = await getRoutines();
        if (cancelled) return;

        const options: RoutineOption[] = (Array.isArray(data) ? data : [])
          .map((item: any) => ({ id: Number(item.id), name: String(item.name ?? `Routine #${item.id}`) }))
          .sort((a: RoutineOption, b: RoutineOption) => b.id - a.id);

        setRoutines(options);
        setSelectedRoutineId((current) => current ?? options[0]?.id ?? null);
      } catch (error: any) {
        if (cancelled) return;
        console.error('[Metrics] Failed to load routines:', error?.response?.data ?? error?.message);
      }
    }

    loadRoutines();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleRoutineMenu = useCallback(() => {
    setIsRoutineMenuOpen((prev) => !prev);
  }, []);

  const selectRoutine = useCallback((routineId: number) => {
    setSelectedRoutineId(routineId);
    setIsRoutineMenuOpen(false);
  }, []);

  const goToCamera = useCallback(() => {
    router.push('/(add)/camera');
  }, []);

  const goToRestDay = useCallback(() => {
    router.push('/(add)/rest-day');
  }, []);

  const goBack = useCallback(() => {
    router.back();
  }, []);

  const submitMetrics = useCallback(async () => {
    if (isSubmitting) return;

    const userId = await getUserId();
    if (!userId) {
      Alert.alert('Not logged in', 'Log in before logging a workout.');
      return;
    }
    if (selectedRoutineId == null) {
      Alert.alert('Pick a routine', 'Select a routine before logging.');
      return;
    }

    setIsSubmitting(true);
    try {
      const workout: WorkoutLogDTO = await createWorkoutLog({
        userId,
        routineId: selectedRoutineId,
      });
      const fullWorkout: WorkoutLogDTO = await getWorkoutLog(workout.id);
      const wles = fullWorkout.exercises ?? [];

      let matchedCount = 0;

      for (const block of exerciseMetrics) {
        const wle = wles.find(
          (candidate) =>
            candidate.exercise?.name?.trim().toLowerCase() === block.name.trim().toLowerCase(),
        );
        if (!wle) {
          console.warn(`[Metrics] No WLE match for "${block.name}" — skipping`);
          continue;
        }

        const firstRepsRow = block.rows.find((row) => row.reps.trim().length > 0);
        const firstLbsRow = block.rows.find((row) => row.lbs.trim().length > 0);

        if (firstRepsRow) {
          const reps = parseFloat(firstRepsRow.reps);
          if (Number.isFinite(reps)) {
            await addMetricToWorkoutLogExercise(wle.id, 'reps', reps);
            matchedCount++;
          }
        }
        if (firstLbsRow) {
          const weight = parseFloat(firstLbsRow.lbs);
          if (Number.isFinite(weight)) {
            await addMetricToWorkoutLogExercise(wle.id, 'weight', weight);
            matchedCount++;
          }
        }
      }

      if (matchedCount === 0) {
        Alert.alert(
          'Workout logged',
          'The workout was started but none of the metrics matched the routine exercises.',
        );
      }

      router.push('/(add)/preview');
    } catch (error: any) {
      console.error('[Metrics] Submit failed:', error?.response?.data ?? error?.message);
      Alert.alert(
        'Could not log workout',
        error?.response?.data?.message ?? 'Network error. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [exerciseMetrics, isSubmitting, selectedRoutineId]);

  return {
    challenges,
    selectedChallengeId,
    isChallengeMenuOpen,
    exerciseMetrics,
    activeRowKey,
    routines,
    selectedRoutineId,
    isRoutineMenuOpen,
    isSubmitting,
    toggleChallengeMenu,
    selectChallenge,
    updateMetricValue,
    updateExerciseNotes,
    onRowFocus,
    onRowBlur,
    toggleRoutineMenu,
    selectRoutine,
    goToCamera,
    goToRestDay,
    goBack,
    submitMetrics,
  };
}
