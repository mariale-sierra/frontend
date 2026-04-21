import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useMetricsEntryStore } from '../store/metricsEntryStore';

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

  const submitMetrics = useCallback(() => {
    router.push('/(add)/preview');
  }, []);

  return {
    challenges,
    selectedChallengeId,
    isChallengeMenuOpen,
    exerciseMetrics,
    activeRowKey,
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
