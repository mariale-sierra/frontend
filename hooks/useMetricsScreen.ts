import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '../utils/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMetricsEntryStore } from '../store/metricsEntryStore';
import { adaptationForRoutine, useWorkoutAdaptationStore } from '../store/workoutAdaptationStore';
import type { WorkoutAdaptation } from '../store/workoutAdaptationStore';
import type { RoutineExerciseRef } from './useLocationSwitch';
import type { TodayRoutineContract } from '../types/challenge';
import { useAuth } from './useAuth';
import { loadTodayRoutine } from '../services/challenge/todayRoutineAdapted';
import { getRoutine } from '../services/routine/routine.service';
import { loadMyChallenges } from '../services/cache/loaders';
import {
  adaptChallengesForMetrics,
  adaptTodayRoutineExercises,
} from '../services/adapters/index';
import { useTranslation } from 'react-i18next';
import { logError, wasErrorToastShown } from '../utils/apiError';
import { useErrorNotificationStore } from '../store/errorNotificationStore';

export function useMetricsScreen() {
  const { userId } = useAuth();
  const { t } = useTranslation();
  const showError = useErrorNotificationStore((state) => state.show);
  // Today's routine could not be read. An API failure already has its toast;
  // anything else (e.g. an unexpected routine shape) still tells the user.
  const reportRoutineLoadError = useCallback(
    (error: unknown) => {
      if (!wasErrorToastShown(error)) showError({ message: t('metrics.alerts.routineLoadError') });
    },
    [showError, t],
  );
  // Set when arriving from the "Log today's progress" challenge picker
  // (app/log.tsx) — preselects that challenge instead of always the first
  // one. Falls back to the first active challenge when absent/invalid.
  const { challengeId: requestedChallengeId } = useLocalSearchParams<{ challengeId?: string }>();

  const challenges = useMetricsEntryStore((state) => state.challenges);
  const selectedChallengeId = useMetricsEntryStore((state) => state.selectedChallengeId);
  const exerciseMetrics = useMetricsEntryStore((state) => state.exerciseMetrics);
  const currentRoutineId = useMetricsEntryStore((state) => state.currentRoutineId);

  const setExerciseMetrics = useMetricsEntryStore((state) => state.setExerciseMetrics);
  const updateMetricValue = useMetricsEntryStore((state) => state.updateMetricValue);
  const hydrateMetricsData = useMetricsEntryStore((state) => state.hydrateMetricsData);

  // B7: the user's own location choice for the routine on screen, if any.
  const adaptation = useWorkoutAdaptationStore((state) =>
    adaptationForRoutine(state.byChallenge[selectedChallengeId], currentRoutineId),
  );

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [challengeLoadError, setChallengeLoadError] = useState<string | null>(null);
  // Cycle-day number + routine name for the header ("Day {{n}} · {{routine}}").
  // Neither is on the challenge itself — both come from the today-routine
  // fetch below (routineName needs one extra, non-blocking GET /routine/:id
  // since getTodayRoutine only returns routine_id, not the routine's name).
  const [currentDay, setCurrentDay] = useState<number | null>(null);
  const [routineName, setRoutineName] = useState<string | null>(null);
  // B7: the user's location swaps were rejected by the backend and dropped.
  const [adaptationInvalid, setAdaptationInvalid] = useState(false);
  // The routine's exercises as WRITTEN (not the user's swapped view): the location sheet always
  // derives its alternatives from these, so changing location twice never compounds swaps.
  const [baseExercises, setBaseExercises] = useState<RoutineExerciseRef[]>([]);
  const setAdaptationInStore = useWorkoutAdaptationStore((state) => state.setAdaptation);
  const clearAdaptationInStore = useWorkoutAdaptationStore((state) => state.clearAdaptation);
  const rememberBase = useCallback((base: TodayRoutineContract) => {
    const rows = (base.exercises ?? []) as Array<{ exercise?: { id?: number; name?: string } | null }>;
    setBaseExercises(
      rows
        .filter((row) => typeof row.exercise?.id === 'number' && typeof row.exercise?.name === 'string')
        .map((row) => ({ exerciseId: row.exercise!.id as number, name: row.exercise!.name as string })),
    );
  }, []);

  // Tracks which challengeId we last fetched a routine for, to avoid double-fetching
  // after the init effect sets selectedChallengeId via hydrateMetricsData.
  const lastFetchedChallengeId = useRef<string>('');

  const loadDayAndRoutineName = useCallback((routineData: { currentDayInCycle?: number; currentDay?: number; routine_id?: number | null }) => {
    setCurrentDay(routineData.currentDayInCycle ?? routineData.currentDay ?? null);
    if (routineData.routine_id) {
      getRoutine(routineData.routine_id)
        .then((routine) => setRoutineName(routine.name))
        .catch(() => setRoutineName(null));
    } else {
      setRoutineName(null);
    }
  }, []);

  // Initial load: fetch enrolled challenges + today's routine for the first challenge.
  useEffect(() => {
    if (!userId) return;

    async function init() {
      setIsLoadingData(true);
      setChallengeLoadError(null);
      try {
        const enrolledChallenges = await loadMyChallenges();
        // Only challenges the user is currently active in can receive a new workout log.
        const activeChallenges = enrolledChallenges.filter((c) => c.status === 'active');
        const adaptedChallenges = adaptChallengesForMetrics(activeChallenges);

        if (!adaptedChallenges.length) {
          hydrateMetricsData({ challenges: [], selectedChallengeId: '', exerciseMetrics: [], routineId: null });
          return;
        }

        // Store challenges first so the dropdown is populated even if the routine fetch fails.
        const initialChallenge =
          adaptedChallenges.find((c) => c.id === requestedChallengeId) ?? adaptedChallenges[0];
        lastFetchedChallengeId.current = initialChallenge.id;
        hydrateMetricsData({
          challenges: adaptedChallenges,
          selectedChallengeId: initialChallenge.id,
          exerciseMetrics: [],
          routineId: null,
        });

        // Then fetch today's routine separately — failure here won't block the dropdown.
        try {
          const { routine: routineData, invalidAdaptation, base } = await loadTodayRoutine(initialChallenge.id);
          setAdaptationInvalid(invalidAdaptation);
          rememberBase(base);
          const exercises = adaptTodayRoutineExercises(routineData, initialChallenge);
          setExerciseMetrics(exercises, routineData.routine_id);
          loadDayAndRoutineName(routineData);
        } catch (routineErr: any) {
          logError('Metrics.initialRoutine', routineErr);
        }
      } catch (error: any) {
        logError('Metrics.challenges', error);
        if (error?.response?.status === 401) {
          setChallengeLoadError('401');
        } else {
          setChallengeLoadError('generic');
        }
      } finally {
        setIsLoadingData(false);
      }
    }

    init();
  }, [userId]);

  // When the user picks a different challenge, fetch that challenge's today-routine.
  useEffect(() => {
    if (!selectedChallengeId || selectedChallengeId === lastFetchedChallengeId.current) return;

    const challenge = challenges.find((c) => c.id === selectedChallengeId);
    if (!challenge) return;

    async function loadRoutine() {
      setIsLoadingData(true);
      try {
        const { routine: routineData, invalidAdaptation, base } = await loadTodayRoutine(selectedChallengeId);
        setAdaptationInvalid(invalidAdaptation);
        rememberBase(base);
        const exercises = adaptTodayRoutineExercises(routineData, challenge!);

        lastFetchedChallengeId.current = selectedChallengeId;
        setExerciseMetrics(exercises, routineData.routine_id);
        loadDayAndRoutineName(routineData);
      } catch (error: any) {
        logError('Metrics.routine', error);
        reportRoutineLoadError(error);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadRoutine();
  }, [selectedChallengeId]);

  // Re-reads today's routine in the user's own view after they pick (or drop) a location.
  const reloadRoutine = useCallback(async () => {
    const challenge = challenges.find((c) => c.id === selectedChallengeId);
    if (!challenge) return;
    setIsLoadingData(true);
    try {
      const { routine: routineData, invalidAdaptation, base } = await loadTodayRoutine(selectedChallengeId);
      setAdaptationInvalid(invalidAdaptation);
      rememberBase(base);
      setExerciseMetrics(adaptTodayRoutineExercises(routineData, challenge), routineData.routine_id);
      loadDayAndRoutineName(routineData);
    } catch (error) {
      logError('Metrics.reloadRoutine', error);
      reportRoutineLoadError(error);
    } finally {
      setIsLoadingData(false);
    }
  }, [challenges, selectedChallengeId, rememberBase, setExerciseMetrics, loadDayAndRoutineName, reportRoutineLoadError]);

  const applyLocation = useCallback(
    (next: WorkoutAdaptation) => {
      setAdaptationInStore(selectedChallengeId, next);
      void reloadRoutine();
    },
    [selectedChallengeId, setAdaptationInStore, reloadRoutine],
  );

  const resetLocation = useCallback(() => {
    clearAdaptationInStore(selectedChallengeId);
    void reloadRoutine();
  }, [selectedChallengeId, clearAdaptationInStore, reloadRoutine]);

  const goToCamera = useCallback(() => {
    router.push('/(add)/camera');
  }, []);

  const goToRestDay = useCallback(() => {
    router.push('/(add)/rest-day');
  }, []);

  const goBack = useCallback(() => {
    safeBack();
  }, []);

  return {
    challenges,
    selectedChallengeId,
    exerciseMetrics,
    isLoadingData,
    challengeLoadError,
    currentDay,
    routineName,
    adaptation,
    adaptationInvalid,
    routineId: currentRoutineId,
    baseExercises,
    applyLocation,
    resetLocation,
    updateMetricValue,
    goToCamera,
    goToRestDay,
    goBack,
  };
}
