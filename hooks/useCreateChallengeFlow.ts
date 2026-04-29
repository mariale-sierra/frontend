import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { buildCreateChallengePayload } from '../services/adapters/createChallengePayloadAdapter';
import { createChallenge } from '../services/challenge/challenge.service';
import type { ChallengeVisibility } from '../types/challenge';
import { useChallengeBuilder } from '../store/challengeBuilderStore';
import { useRoutineBuilder } from '../store/routineBuilderStore';
import { useTranslation } from 'react-i18next';

export type CreateStep =
  | { kind: 'identity'; eyebrow: string; title: string; description: string }
  | { kind: 'categories'; eyebrow: string; title: string; description: string }
  | { kind: 'cycle'; eyebrow: string; title: string; description: string }
  | { kind: 'days'; eyebrow: string; title: string; description: string }
  | { kind: 'settings'; eyebrow: string; title: string; description: string }
  | { kind: 'review'; eyebrow: string; title: string; description: string };

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

interface ValidationLabels {
  challengeName: string;
  exerciseCategories: string;
  challengeLocation: string;
  cycleDuration: string;
  configureEveryDay: string;
  routineSelectionPerDay: string;
  challengeDurationTotal: string;
  visibility: string;
}

function getStepErrors(step: CreateStep, params: {
  title: string;
  selectedCategories: string[];
  selectedLocations: string[];
  hasRoutineForEveryDay: boolean;
  cycleDuration: number;
  effectiveChallengeDuration: number;
  visibility: ChallengeVisibility | null;
  labels: ValidationLabels;
}) {
  switch (step.kind) {
    case 'identity':
      return params.title.trim().length === 0 ? [params.labels.challengeName] : [];
    case 'categories':
      return [
        ...(params.selectedCategories.length === 0 ? [params.labels.exerciseCategories] : []),
        ...(params.selectedLocations.length === 0 ? [params.labels.challengeLocation] : []),
      ];
    case 'cycle':
      return params.cycleDuration > 0 ? [] : [params.labels.cycleDuration];
    case 'days':
      return params.hasRoutineForEveryDay ? [] : [params.labels.configureEveryDay];
    case 'settings':
      return [
        ...(params.effectiveChallengeDuration > 0 ? [] : [params.labels.challengeDurationTotal]),
        ...(params.visibility ? [] : [params.labels.visibility]),
      ];
    case 'review':
      return [];
  }
}

export function useCreateChallengeFlow() {
  const { t } = useTranslation();
  const title = useChallengeBuilder((state) => state.title);
  const description = useChallengeBuilder((state) => state.description);
  const cycleDuration = useChallengeBuilder((state) => state.cycleDuration);
  const challengeDuration = useChallengeBuilder((state) => state.challengeDuration);
  const visibility = useChallengeBuilder((state) => state.visibility);
  const currentStep = useChallengeBuilder((state) => state.currentStep);
  const selectedCategories = useChallengeBuilder((state) => state.selectedCategories);
  const selectedLocations = useChallengeBuilder((state) => state.selectedLocations);
  const setTitle = useChallengeBuilder((state) => state.setTitle);
  const setDescription = useChallengeBuilder((state) => state.setDescription);
  const setCycleDuration = useChallengeBuilder((state) => state.setCycleDuration);
  const setChallengeDuration = useChallengeBuilder((state) => state.setChallengeDuration);
  const setVisibility = useChallengeBuilder((state) => state.setVisibility);
  const setCurrentStep = useChallengeBuilder((state) => state.setCurrentStep);
  const setSelectedCategories = useChallengeBuilder((state) => state.setSelectedCategories);
  const setSelectedLocations = useChallengeBuilder((state) => state.setSelectedLocations);
  const resetChallengeBuilder = useChallengeBuilder((state) => state.resetChallengeBuilder);

  const routinesByDay = useRoutineBuilder((state) => state.routinesByDay);
  const pruneRoutinesAfterDay = useRoutineBuilder((state) => state.pruneRoutinesAfterDay);
  const unassignRoutineFromDay = useRoutineBuilder((state) => state.unassignRoutineFromDay);

  const [selectedDay, setSelectedDay] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationLabels = useMemo<ValidationLabels>(() => ({
    challengeName: t('challengeCreate.validation.challengeName'),
    exerciseCategories: t('challengeCreate.validation.exerciseCategories'),
    challengeLocation: t('challengeCreate.validation.challengeLocation'),
    cycleDuration: t('challengeCreate.validation.cycleDuration'),
    configureEveryDay: t('challengeCreate.validation.configureEveryDay'),
    routineSelectionPerDay: t('challengeCreate.validation.routineSelectionPerDay'),
    challengeDurationTotal: t('challengeCreate.validation.challengeDurationTotal'),
    visibility: t('challengeCreate.validation.visibility'),
  }), [t]);

  const steps = useMemo<CreateStep[]>(() => ([
    {
      kind: 'identity',
      eyebrow: t('challengeCreate.steps.identity.eyebrow'),
      title: t('challengeCreate.steps.identity.title'),
      description: t('challengeCreate.steps.identity.description'),
    },
    {
      kind: 'categories',
      eyebrow: t('challengeCreate.steps.categories.eyebrow'),
      title: t('challengeCreate.steps.categories.title'),
      description: t('challengeCreate.steps.categories.description'),
    },
    {
      kind: 'cycle',
      eyebrow: t('challengeCreate.steps.cycle.eyebrow'),
      title: t('challengeCreate.steps.cycle.title'),
      description: t('challengeCreate.steps.cycle.description'),
    },
    {
      kind: 'days',
      eyebrow: t('challengeCreate.steps.days.eyebrow'),
      title: t('challengeCreate.steps.days.title'),
      description: t('challengeCreate.steps.days.description'),
    },
    {
      kind: 'settings',
      eyebrow: t('challengeCreate.steps.settings.eyebrow'),
      title: t('challengeCreate.steps.settings.title'),
      description: t('challengeCreate.steps.settings.description'),
    },
    {
      kind: 'review',
      eyebrow: t('challengeCreate.steps.review.eyebrow'),
      title: t('challengeCreate.steps.review.title'),
      description: t('challengeCreate.steps.review.description'),
    },
  ]), [t]);

  const hasRoutineForEveryDay = useMemo(
    () => Array.from({ length: cycleDuration }, (_, index) => index + 1)
      .every((dayNumber) => Boolean(routinesByDay[dayNumber])),
    [cycleDuration, routinesByDay],
  );

  const effectiveChallengeDuration = challengeDuration ?? cycleDuration;
  const activeStep = steps[Math.min(currentStep, steps.length - 1)];
  const daysStepIndex = steps.findIndex((step) => step.kind === 'days');

  useEffect(() => {
    if (currentStep > steps.length - 1) {
      setCurrentStep(steps.length - 1);
    }
  }, [currentStep, setCurrentStep, steps.length]);

  useEffect(() => {
    pruneRoutinesAfterDay(cycleDuration);
  }, [cycleDuration, pruneRoutinesAfterDay]);

  useEffect(() => {
    setSelectedDay((currentDay) => {
      const maxDay = Math.max(1, cycleDuration);
      return Math.min(Math.max(currentDay, 1), maxDay);
    });
  }, [cycleDuration]);

  const activeStepErrors = getStepErrors(activeStep, {
    title,
    selectedCategories,
    selectedLocations,
    hasRoutineForEveryDay,
    cycleDuration,
    effectiveChallengeDuration,
    visibility,
    labels: validationLabels,
  });

  const missingConfigurationFields = useMemo(() => {
    const missing: string[] = [];

    if (title.trim().length === 0) missing.push(validationLabels.challengeName);
    if (selectedCategories.length === 0) missing.push(validationLabels.exerciseCategories);
    if (selectedLocations.length === 0) missing.push(validationLabels.challengeLocation);
    if (cycleDuration <= 0) missing.push(validationLabels.cycleDuration);
    if (!hasRoutineForEveryDay) missing.push(validationLabels.routineSelectionPerDay);
    if (effectiveChallengeDuration <= 0) missing.push(validationLabels.challengeDurationTotal);
    if (!visibility) missing.push(validationLabels.visibility);

    return missing;
  }, [
    title,
    selectedCategories,
    selectedLocations,
    cycleDuration,
    hasRoutineForEveryDay,
    effectiveChallengeDuration,
    visibility,
    validationLabels,
  ]);

  const isFormComplete = title.trim().length > 0
    && selectedCategories.length > 0
    && selectedLocations.length > 0
    && cycleDuration > 0
    && hasRoutineForEveryDay
    && effectiveChallengeDuration > 0
    && Boolean(visibility);

  const configuredDays = Array.from({ length: cycleDuration }, (_, index) => index + 1)
    .filter((dayNumber) => Boolean(routinesByDay[dayNumber]));
  const allCycleDays = Array.from({ length: cycleDuration }, (_, index) => index + 1);
  const selectedDayRoutine = routinesByDay[selectedDay];
  const daySummaries = allCycleDays.map((dayNumber) => {
    const routine = routinesByDay[dayNumber];
    if (!routine) {
      return t('challengeCreate.daySummary.missing', { day: dayNumber });
    }

    if (routine.isRestDay) {
      return t('challengeCreate.daySummary.rest', { day: dayNumber });
    }

    return t('challengeCreate.daySummary.configured', {
      day: dayNumber,
      routine: routine.name || t('challengeCreate.daySummary.selectedRoutine'),
    });
  });

  function getDayStatus(dayNumber: number) {
    const routine = routinesByDay[dayNumber];

    if (!routine) {
      return 'empty';
    }

    return routine.isRestDay ? 'rest' : 'configured';
  }

  function handleBack() {
    if (currentStep === 0) {
      router.back();
      return;
    }

    setCurrentStep(currentStep - 1);
  }

  function handleNext() {
    if (activeStepErrors.length > 0) {
      const bulletList = activeStepErrors.map((item) => `• ${item}`).join('\n');
      Alert.alert(
        t('challengeCreate.alerts.completeStepTitle'),
        t('challengeCreate.alerts.completeStepMessage', { items: bulletList }),
      );
      return;
    }

    setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
  }

  async function handleActionPress(actionLabel: string) {
    if (missingConfigurationFields.length > 0) {
      const bulletList = missingConfigurationFields.map((item) => `• ${item}`).join('\n');
      Alert.alert(
        t('challengeCreate.alerts.missingConfigTitle'),
        t('challengeCreate.alerts.missingConfigMessage', {
          action: actionLabel,
          items: bulletList,
        }),
      );
      return;
    }

    if (!visibility) {
      Alert.alert(
        t('challengeCreate.alerts.missingConfigTitle'),
        t('challengeCreate.alerts.selectVisibilityMessage'),
      );
      return;
    }

    const payloadResult = buildCreateChallengePayload({
      title,
      description,
      visibility,
      challengeDuration: effectiveChallengeDuration,
      cycleDuration,
      selectedCategories,
      selectedLocations,
      routinesByDay,
    });

    if (!payloadResult.ok) {
      Alert.alert(
        t('challengeCreate.alerts.cannotBuildPayloadTitle'),
        payloadResult.errors.map((item) => `• ${item}`).join('\n'),
      );
      return;
    }

    const { payload } = payloadResult;

    setIsSubmitting(true);
    try {
      await createChallenge(payload);
      resetChallengeBuilder();
      router.replace('/(tabs)/challenges');
    } catch {
      Alert.alert(t('common.errors.genericTitle'), t('challengeCreate.alerts.createFailedMessage'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleCategory(value: string) {
    setSelectedCategories(toggleValue(selectedCategories, value));
  }

  function toggleLocation(value: string) {
    setSelectedLocations(toggleValue(selectedLocations, value));
  }

  function openDayRoutineSelector(day: number) {
    router.push(`/challenge/routine/select?day=${day}`);
  }

  return {
    title,
    description,
    cycleDuration,
    visibility,
    selectedCategories,
    selectedLocations,
    currentStep,
    effectiveChallengeDuration,
    activeStep,
    steps,
    progress: (currentStep + 1) / steps.length,
    activeStepErrors,
    isFormComplete,
    configuredDays,
    selectedDay,
    selectedDayRoutine,
    daySummaries,
    daysStepIndex,
    setTitle,
    setDescription,
    setCycleDuration,
    setChallengeDuration,
    setVisibility,
    setCurrentStep,
    setSelectedDay,
    isSubmitting,
    getDayStatus,
    handleBack,
    handleNext,
    handleActionPress,
    toggleCategory,
    toggleLocation,
    openDayRoutineSelector,
    unassignRoutineFromDay,
  };
}
