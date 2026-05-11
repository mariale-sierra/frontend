import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useMetricsEntryStore } from '../store/metricsEntryStore';
import { useAuth } from './useAuth';
import { createWorkoutLog, getWorkoutLog } from '../services/workout-log/workout-log.service';
import { addMetricToWorkoutLogExercise } from '../services/metrics/metrics.service';
import {
  getUserEnrolledChallenges,
  getTodayRoutineForChallenge,
} from '../services/challenge/challenge.service';
import {
  adaptChallengesForMetrics,
  adaptTodayRoutineExercises,
} from '../services/adapters/index';
import type { WorkoutLogContract } from '../types/workout-log';
import { useTranslation } from 'react-i18next';

export function useMetricsScreen() {
  const { userId } = useAuth();
  const { t } = useTranslation();

  const challenges = useMetricsEntryStore((state) => state.challenges);
  const selectedChallengeId = useMetricsEntryStore((state) => state.selectedChallengeId);
  const isChallengeMenuOpen = useMetricsEntryStore((state) => state.isChallengeMenuOpen);
  const exerciseMetrics = useMetricsEntryStore((state) => state.exerciseMetrics);
  const currentRoutineId = useMetricsEntryStore((state) => state.currentRoutineId);

  const toggleChallengeMenu = useMetricsEntryStore((state) => state.toggleChallengeMenu);
  const selectChallenge = useMetricsEntryStore((state) => state.selectChallenge);
  const setExerciseMetrics = useMetricsEntryStore((state) => state.setExerciseMetrics);
  const updateMetricValue = useMetricsEntryStore((state) => state.updateMetricValue);
  const updateExerciseNotes = useMetricsEntryStore((state) => state.updateExerciseNotes);
  const hydrateMetricsData = useMetricsEntryStore((state) => state.hydrateMetricsData);

  const [activeRowKey, setActiveRowKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [challengeLoadError, setChallengeLoadError] = useState<string | null>(null);

  // Tracks which challengeId we last fetched a routine for, to avoid double-fetching
  // after the init effect sets selectedChallengeId via hydrateMetricsData.
  const lastFetchedChallengeId = useRef<string>('');

  useEffect(() => {
    console.log('[useMetricsScreen] store challenges after set', challenges, '| length:', challenges.length);
  }, [challenges]);

  // Initial load: fetch enrolled challenges + today's routine for the first challenge.
  useEffect(() => {
    if (!userId) return;

    async function init() {
      setIsLoadingData(true);
      setChallengeLoadError(null);
      try {
        const rawChallenges = await getUserEnrolledChallenges();
        console.log('[Metrics] Raw challenges from API:', rawChallenges);
        const adaptedChallenges = adaptChallengesForMetrics(rawChallenges);
        console.log('[Metrics] Adapted challenges for dropdown:', adaptedChallenges);

        if (!adaptedChallenges.length) {
          hydrateMetricsData({ challenges: [], selectedChallengeId: '', exerciseMetrics: [], routineId: null });
          return;
        }

        // Store challenges first so the dropdown is populated even if the routine fetch fails.
        const firstChallenge = adaptedChallenges[0];
        lastFetchedChallengeId.current = firstChallenge.id;
        console.log('[useMetricsScreen] challenges before store', adaptedChallenges);
        hydrateMetricsData({
          challenges: adaptedChallenges,
          selectedChallengeId: firstChallenge.id,
          exerciseMetrics: [],
          routineId: null,
        });

        // Then fetch today's routine separately — failure here won't block the dropdown.
        try {
          const routineData = await getTodayRoutineForChallenge(firstChallenge.id);
          const exercises = adaptTodayRoutineExercises(routineData, firstChallenge);
          setExerciseMetrics(exercises, routineData.routine_id);
        } catch (routineErr: any) {
          console.warn(
            '[Metrics] Could not load today\'s routine (dropdown still works):',
            routineErr?.response?.status,
            routineErr?.response?.data ?? routineErr?.message,
          );
        }
      } catch (error: any) {
        console.error('[Metrics] Challenge load failed:', error?.response?.status, error?.response?.data ?? error?.message);
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
        const routineData = await getTodayRoutineForChallenge(selectedChallengeId);
        const exercises = adaptTodayRoutineExercises(routineData, challenge!);

        lastFetchedChallengeId.current = selectedChallengeId;
        setExerciseMetrics(exercises, routineData.routine_id);
      } catch (error: any) {
        console.error('[Metrics] Routine load failed:', error?.response?.data ?? error?.message);
        Alert.alert(t('metrics.alerts.submitErrorTitle'), t('metrics.alerts.submitErrorFallback'));
      } finally {
        setIsLoadingData(false);
      }
    }

    loadRoutine();
  }, [selectedChallengeId]);

  const onRowFocus = useCallback((rowKey: string) => {
    setActiveRowKey(rowKey);
  }, []);

  const onRowBlur = useCallback((rowKey: string) => {
    setActiveRowKey((current) => (current === rowKey ? null : current));
  }, []);

  useEffect(() => {
    setActiveRowKey(null);
  }, [selectedChallengeId]);

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

    if (!userId) {
      Alert.alert(t('metrics.alerts.notLoggedInTitle'), t('metrics.alerts.notLoggedInMessage'));
      return;
    }

    setIsSubmitting(true);
    try {
      const workout: WorkoutLogContract = await createWorkoutLog({
        userId,
        routineId: currentRoutineId ?? undefined,
      });
      const fullWorkout: WorkoutLogContract = await getWorkoutLog(workout.id);
      const wles = fullWorkout.exercises ?? [];

      let matchedCount = 0;

      for (const block of exerciseMetrics) {
        const wle = wles.find((candidate) => candidate.exercise?.id === block.exerciseId);
        if (!wle) {
          console.warn(`[Metrics] No WLE match for exerciseId=${block.exerciseId} "${block.name}" — skipping`);
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
        Alert.alert(t('metrics.alerts.loggedTitle'), t('metrics.alerts.noMatchMessage'));
      }

      router.push('/(add)/preview');
    } catch (error: any) {
      console.error('[Metrics] Submit failed:', error?.response?.data ?? error?.message);
      Alert.alert(
        t('metrics.alerts.submitErrorTitle'),
        error?.response?.data?.message ?? t('metrics.alerts.submitErrorFallback'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [currentRoutineId, exerciseMetrics, isSubmitting, t, userId]);

  return {
    challenges,
    selectedChallengeId,
    isChallengeMenuOpen,
    exerciseMetrics,
    activeRowKey,
    isSubmitting,
    isLoadingData,
    challengeLoadError,
    toggleChallengeMenu,
    selectChallenge,
    updateMetricValue,
    updateExerciseNotes,
    onRowFocus,
    onRowBlur,
    goToCamera,
    goToRestDay,
    goBack,
    submitMetrics,
  };
}
