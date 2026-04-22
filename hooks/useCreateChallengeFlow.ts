import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { buildCreateChallengePayload } from '../services/adapters/createChallengePayloadAdapter';
import { createChallenge } from '../services/challenge.service';
import type { ChallengeVisibility } from '../store/challengeBuilderStore';
import { useChallengeBuilder } from '../store/challengeBuilderStore';
import { useRoutineBuilder } from '../store/routineBuilderStore';

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

function getStepErrors(step: CreateStep, params: {
  title: string;
  selectedCategories: string[];
  selectedLocations: string[];
  hasRoutineForEveryDay: boolean;
  cycleDuration: number;
  effectiveChallengeDuration: number;
  visibility: ChallengeVisibility | null;
}) {
  switch (step.kind) {
    case 'identity':
      return params.title.trim().length === 0 ? ['Challenge name'] : [];
    case 'categories':
      return [
        ...(params.selectedCategories.length === 0 ? ['Exercise categories'] : []),
        ...(params.selectedLocations.length === 0 ? ['Challenge location'] : []),
      ];
    case 'cycle':
      return params.cycleDuration > 0 ? [] : ['Cycle duration'];
    case 'days':
      return params.hasRoutineForEveryDay ? [] : ['Configure every day in the cycle'];
    case 'settings':
      return [
        ...(params.effectiveChallengeDuration > 0 ? [] : ['Challenge duration total']),
        ...(params.visibility ? [] : ['Visibility']),
      ];
    case 'review':
      return [];
  }
}

export function useCreateChallengeFlow() {
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

  const steps = useMemo<CreateStep[]>(() => ([
    {
      kind: 'identity',
      eyebrow: 'Step 1',
      title: 'Give the challenge an identity',
      description: 'Start with the name. It is the most personal decision and gives context to everything that follows.',
    },
    {
      kind: 'categories',
      eyebrow: 'Step 2',
      title: 'Choose categories and location',
      description: 'Define what kind of challenge this is before planning the days. That makes the routine decisions feel coherent.',
    },
    {
      kind: 'cycle',
      eyebrow: 'Step 3',
      title: 'Set the cycle duration',
      description: 'A cycle is the sequence of days that repeats through the challenge. Set it here so the next screen can generate the full day plan with the right number of days.',
    },
    {
      kind: 'days',
      eyebrow: 'Step 4',
      title: 'Configure the cycle days',
      description: 'Plan the whole cycle in one pass so the user can compare days and shape the weekly rhythm without jumping across screens.',
    },
    {
      kind: 'settings',
      eyebrow: 'Step 5',
      title: 'Set duration and visibility',
      description: 'Define how long the full challenge lasts and whether it should be public or private before moving to the final review.',
    },
    {
      kind: 'review',
      eyebrow: 'Step 6',
      title: 'Review and publish',
      description: 'Review the identity, categories, duration, and every configured day so the user can publish with confidence.',
    },
  ]), []);

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
  });

  const missingConfigurationFields = useMemo(() => {
    const missing: string[] = [];

    if (title.trim().length === 0) missing.push('Challenge name');
    if (selectedCategories.length === 0) missing.push('Exercise categories');
    if (selectedLocations.length === 0) missing.push('Challenge location');
    if (cycleDuration <= 0) missing.push('Cycle duration');
    if (!hasRoutineForEveryDay) missing.push('Routine selection for each day');
    if (effectiveChallengeDuration <= 0) missing.push('Challenge duration total');
    if (!visibility) missing.push('Visibility');

    return missing;
  }, [
    title,
    selectedCategories,
    selectedLocations,
    cycleDuration,
    hasRoutineForEveryDay,
    effectiveChallengeDuration,
    visibility,
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
      return `DAY ${dayNumber}: Missing`;
    }

    if (routine.isRestDay) {
      return `DAY ${dayNumber}: Rest day`;
    }

    return `DAY ${dayNumber}: ${routine.name || 'Routine selected'}`;
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
      Alert.alert(
        'Complete this step',
        `Before continuing, complete:\n\n${activeStepErrors.map((item) => `• ${item}`).join('\n')}`,
      );
      return;
    }

    setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
  }

  async function handleActionPress(actionLabel: string) {
    if (missingConfigurationFields.length > 0) {
      Alert.alert(
        'Missing configuration',
        `Before "${actionLabel}", please complete:\n\n${missingConfigurationFields.map((item) => `• ${item}`).join('\n')}`,
      );
      return;
    }

    if (!visibility) {
      Alert.alert('Missing configuration', 'Select challenge visibility before continuing.');
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
        'Cannot build challenge payload',
        payloadResult.errors.map((item) => `• ${item}`).join('\n'),
      );
      return;
    }

    const { payload } = payloadResult;

    setIsSubmitting(true);
    try {
      await createChallenge({
        name: payload.name,
        description: payload.description,
        visibility: payload.visibility,
        duration_days: payload.duration_days,
        cycle_length_days: payload.cycle_length_days,
      });
      resetChallengeBuilder();
      router.replace('/(tabs)/challenges');
    } catch {
      Alert.alert('Error', 'Could not create the challenge. Please try again.');
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
