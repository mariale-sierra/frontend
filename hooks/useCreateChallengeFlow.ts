import { router } from 'expo-router';
import { safeBack } from '../utils/navigation';
import { Alert } from 'react-native';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { buildCreateChallengePayload } from '../services/adapters/index';
import { createChallenge } from '../services/challenge/challenge.service';
import type { ChallengeVisibility } from '../types/challenge';
import { useChallengeBuilder } from '../store/challengeBuilderStore';
import { getRoutineLocationSummary, useRoutineBuilder } from '../store/routineBuilderStore';
import { colors, activityColors } from '../constants/theme';
import { CATEGORY_TO_ACTIVITY } from '../constants/challengeFilters';
import type { ActivityType } from '../types/activity';
import { useTranslation } from 'react-i18next';
import { createChallengeNameSchema, type ChallengeNameFormValues } from '../validation/challengeSchemas';
import { invalidateAfterMembershipChanged } from '../services/cache/queries';
import { logError, wasErrorToastShown } from '../utils/apiError';

// The old single "Build the cycle" step is two steps now: 'cycleLength'
// (53A — the cycle's length and the challenge's length, with a calendar
// preview) then 'cycleFill' (53B — a routine or rest for every cycle day).
// The challenge's length moved out of the old step 4, which is now only
// 'visibility'.
export type CreateStep =
  | { kind: 'name'; title: string; description: string }
  | { kind: 'activityLocation'; title: string; description: string }
  | { kind: 'cycleLength'; title: string; description: string }
  | { kind: 'cycleFill'; title: string; description: string }
  | { kind: 'visibility'; title: string; description: string }
  | { kind: 'review'; title: string; description: string }
  // The last step (2026-10-20): how every challenge works — a photo a day —
  // and where "Start challenge" lives.
  | { kind: 'rules'; title: string; description: string };

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

interface ValidationLabels {
  challengeName: string;
  exerciseCategories: string;
  challengeLocation: string;
  configureEveryDay: string;
  visibility: string;
}

function getStepErrors(step: CreateStep, params: {
  title: string;
  selectedCategories: string[];
  selectedLocations: string[];
  hasRoutineForEveryDay: boolean;
  visibility: ChallengeVisibility | null;
  labels: ValidationLabels;
}) {
  switch (step.kind) {
    case 'name':
      return params.title.trim().length === 0 ? [params.labels.challengeName] : [];
    case 'activityLocation':
      return [
        ...(params.selectedCategories.length === 0 ? [params.labels.exerciseCategories] : []),
        ...(params.selectedLocations.length === 0 ? [params.labels.challengeLocation] : []),
      ];
    case 'cycleLength':
      // Both steppers are clamped to valid values — nothing to complete.
      return [];
    case 'cycleFill':
      return params.hasRoutineForEveryDay ? [] : [params.labels.configureEveryDay];
    case 'visibility':
      return params.visibility ? [] : [params.labels.visibility];
    case 'review':
    case 'rules':
      return [];
  }
}

export function useCreateChallengeFlow() {
  const { t } = useTranslation();
  const title = useChallengeBuilder((state) => state.title);
  const description = useChallengeBuilder((state) => state.description);
  const cycleLengthDays = useChallengeBuilder((state) => state.cycleLengthDays);
  const durationDays = useChallengeBuilder((state) => state.durationDays);
  const visibility = useChallengeBuilder((state) => state.visibility);
  const currentStep = useChallengeBuilder((state) => state.currentStep);
  const selectedCategories = useChallengeBuilder((state) => state.selectedCategories);
  const selectedLocations = useChallengeBuilder((state) => state.selectedLocations);
  const setTitle = useChallengeBuilder((state) => state.setTitle);
  const setDescription = useChallengeBuilder((state) => state.setDescription);
  const setCycleLengthInStore = useChallengeBuilder((state) => state.setCycleLengthDays);
  const addCycleDayInStore = useChallengeBuilder((state) => state.addCycleDay);
  const removeCycleDayInStore = useChallengeBuilder((state) => state.removeCycleDay);
  const setDurationDays = useChallengeBuilder((state) => state.setDurationDays);
  const setVisibility = useChallengeBuilder((state) => state.setVisibility);
  const setCurrentStep = useChallengeBuilder((state) => state.setCurrentStep);
  const setSelectedCategories = useChallengeBuilder((state) => state.setSelectedCategories);
  const setSelectedLocations = useChallengeBuilder((state) => state.setSelectedLocations);
  const resetChallengeBuilder = useChallengeBuilder((state) => state.resetChallengeBuilder);

  const routinesByDay = useRoutineBuilder((state) => state.routinesByDay);
  const removeDayAndShift = useRoutineBuilder((state) => state.removeDayAndShift);
  const resetRoutineBuilder = useRoutineBuilder((state) => state.resetBuilder);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Name step's title field: the only text input in this whole multi-step
  // flow (the other steps are pill grids / day lists / cards, not text
  // fields — they keep the existing step-level Alert summary below). `title`
  // itself still lives in challengeBuilderStore (shared across steps/screens
  // in this flow); this form only owns the zod validation + inline error,
  // synced to the store on every change.
  const nameSchema = useMemo(() => createChallengeNameSchema(t), [t]);
  const {
    setValue: setTitleFormValue,
    trigger: triggerTitleValidation,
    formState: { errors: titleErrors },
  } = useForm<ChallengeNameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { title },
  });

  function handleChangeTitle(value: string) {
    setTitle(value);
    setTitleFormValue('title', value, { shouldValidate: Boolean(titleErrors.title) });
  }

  function handleBlurTitle() {
    triggerTitleValidation('title');
  }

  const validationLabels = useMemo<ValidationLabels>(() => ({
    challengeName: t('challengeCreate.validation.challengeName'),
    exerciseCategories: t('challengeCreate.validation.exerciseCategories'),
    challengeLocation: t('challengeCreate.validation.challengeLocation'),
    configureEveryDay: t('challengeCreate.validation.configureEveryDay'),
    visibility: t('challengeCreate.validation.visibility'),
  }), [t]);

  const steps = useMemo<CreateStep[]>(() => ([
    {
      kind: 'name',
      title: t('challengeCreate.steps.name.title'),
      description: t('challengeCreate.steps.name.description'),
    },
    // "What kind of training?" — the challenge's activity categories and locations.
    // It was taken out of the sequence on 2026-09-04 (the picker has its own filters,
    // so it looked redundant) and put back 2026-09-20, on explicit request: these
    // choices are what LIMIT the exercises the picker offers
    // (app/challenge/routine/exercises.tsx, routine/select.tsx), so they have to be
    // made first.
    {
      kind: 'activityLocation',
      title: t('challengeCreate.steps.activityLocation.title'),
      description: t('challengeCreate.steps.activityLocation.description'),
    },
    {
      kind: 'cycleLength',
      title: t('challengeCreate.steps.cycleLength.title'),
      description: t('challengeCreate.steps.cycleLength.description'),
    },
    {
      kind: 'cycleFill',
      title: t('challengeCreate.steps.cycleFill.title'),
      description: t('challengeCreate.steps.cycleFill.description'),
    },
    {
      kind: 'visibility',
      title: t('challengeCreate.steps.visibility.title'),
      description: t('challengeCreate.steps.visibility.description'),
    },
    {
      kind: 'review',
      title: t('challengeCreate.steps.review.title'),
      description: t('challengeCreate.steps.review.description'),
    },
    {
      kind: 'rules',
      title: t('challengeCreate.steps.rules.title'),
      description: t('challengeCreate.steps.rules.description'),
    },
  ]), [t]);

  // The first cycle day with nothing assigned yet (53B's "Fill day N to
  // continue"), or null once every day has a routine or is a rest day.
  const firstUnfilledDay = useMemo(() => {
    for (let day = 1; day <= cycleLengthDays; day += 1) {
      if (!routinesByDay[day]) return day;
    }
    return null;
  }, [cycleLengthDays, routinesByDay]);
  const hasRoutineForEveryDay = firstUnfilledDay === null;

  const activeStep = steps[Math.min(currentStep, steps.length - 1)];
  const isReviewStep = activeStep.kind === 'review';
  // The step that submits: the last one, the rules.
  const isFinalStep = activeStep.kind === 'rules';

  // Monday-based weekday of today (0 = Mon … 6 = Sun): day 1 of the calendar
  // preview sits in today's column — the challenge starts the day it's made.
  const startWeekday = useMemo(() => (new Date().getDay() + 6) % 7, []);

  const activeStepErrors = getStepErrors(activeStep, {
    title,
    selectedCategories,
    selectedLocations,
    hasRoutineForEveryDay,
    visibility,
    labels: validationLabels,
  });

  const missingConfigurationFields = useMemo(() => {
    const missing: string[] = [];

    if (title.trim().length === 0) missing.push(validationLabels.challengeName);
    if (selectedCategories.length === 0) missing.push(validationLabels.exerciseCategories);
    if (selectedLocations.length === 0) missing.push(validationLabels.challengeLocation);
    if (!hasRoutineForEveryDay) missing.push(validationLabels.configureEveryDay);
    if (!visibility) missing.push(validationLabels.visibility);

    return missing;
  }, [
    title,
    selectedCategories,
    selectedLocations,
    hasRoutineForEveryDay,
    visibility,
    validationLabels,
  ]);

  // Single source of truth for "is the form complete": derived from the same
  // `missingConfigurationFields` list used to build the submit-blocking hint, rather than
  // re-declaring the same rule set as a second boolean chain.
  const isFormComplete = missingConfigurationFields.length === 0;

  function getDayStatus(dayNumber: number) {
    const routine = routinesByDay[dayNumber];

    if (!routine) {
      return 'empty';
    }

    return routine.isRestDay ? 'rest' : 'configured';
  }

  function handleBack() {
    if (currentStep === 0) {
      safeBack();
      return;
    }

    setCurrentStep(currentStep - 1);
  }

  async function handleNext() {
    // The name step's title is a real text field now validated inline
    // (see nameSchema/titleErrors above) rather than through the step-level
    // Alert — every other step stays on the Alert summary below, since none
    // of them are text inputs the shared field system covers.
    if (activeStep.kind === 'name') {
      const valid = await triggerTitleValidation('title');
      if (!valid) return;
      setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
      return;
    }

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

  async function handleActionPress() {
    if (missingConfigurationFields.length > 0) {
      const bulletList = missingConfigurationFields.map((item) => `• ${item}`).join('\n');
      Alert.alert(
        t('challengeCreate.alerts.missingConfigTitle'),
        t('challengeCreate.alerts.missingConfigMessage', { items: bulletList }),
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

    // Safe to build without re-validating: the missingConfigurationFields check above
    // (backed by the same rules as getStepErrors) already guarantees every required field
    // is present.
    const payload = buildCreateChallengePayload({
      title,
      description,
      visibility,
      cycleLengthDays,
      durationDays,
      selectedCategories,
      selectedLocations,
      routinesByDay,
    });

    setIsSubmitting(true);
    try {
      await createChallenge(payload);
      invalidateAfterMembershipChanged();
      resetChallengeBuilder();
      // Real bug, fixed 2026-08-29, per user report ("the previous cycle
      // configured shows set up" on the NEXT challenge creation): this store
      // holds `routinesByDay` (the "Build the Cycle" step's per-day
      // assignments) — resetChallengeBuilder() above never touched it, so a
      // finished challenge's day-1..N routines stayed in the store and
      // select.tsx's init(dayNumber) (no explicit routine — it falls back to
      // `routinesByDay[day]`) would silently hydrate the NEXT challenge's
      // "New workout" flow from the PREVIOUS challenge's leftover data.
      resetRoutineBuilder();
      // Lands on Mine, where the new challenge now is — the same place joining
      // one from Browse (or accepting an invite) ends (2026-10-20, explicit
      // request; it used to open the new challenge's info screen). `view=mine`
      // switches the Challenges tab even if it's still mounted underneath on
      // Browse (see its own `requestedView` effect).
      router.replace('/(tabs)/challenges?view=mine');
    } catch (err: unknown) {
      // Never the raw error: it carries the request headers (the bearer token).
      logError('createChallenge', err);

      // Any API failure (moderation included) already got its translated toast
      // from the global interceptor — no second Alert with the server's raw text.
      if (wasErrorToastShown(err)) return;

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

  function addCycleDay() {
    addCycleDayInStore();
  }

  // × on a day row (53B): drop that day and renumber the ones after it.
  function removeCycleDay(dayNumber: number) {
    if (cycleLengthDays <= 1) {
      return;
    }

    removeDayAndShift(dayNumber, cycleLengthDays);
    removeCycleDayInStore();
  }

  // The "Cycle" stepper (53A). Growing it adds empty days at the end;
  // shrinking it drops the last days, with whatever was assigned to them, so
  // growing it back gives empty days — never stale routines.
  function setCycleLengthDays(next: number) {
    if (next < cycleLengthDays) {
      for (let day = cycleLengthDays; day > Math.max(next, 1); day -= 1) {
        removeDayAndShift(day, day);
      }
    }
    setCycleLengthInStore(next);
  }

  function openDayRoutineSelector(day: number) {
    router.push({
      pathname: '/challenge/routine/select',
      params: { day: String(day) },
    });
  }

  function getDayRoutineLabel(dayNumber: number) {
    const routine = routinesByDay[dayNumber];

    if (!routine) {
      return undefined;
    }

    if (routine.name && routine.name.trim().length > 0) {
      return routine.name;
    }

    return routine.isRestDay ? 'Rest day' : undefined;
  }

  // Row subtitle for a configured workout day: real exercise count + real
  // location summary, both derived from the routine itself — no fabricated
  // duration figure (the wireframe's literal "45 min" has no backing data
  // anywhere in this flow, so it's intentionally left out rather than made up).
  function getDayRoutineMeta(dayNumber: number) {
    const routine = routinesByDay[dayNumber];

    if (!routine || routine.isRestDay) {
      return undefined;
    }

    const exercisesLabel = t('challengeInfo.exerciseCount', { count: routine.exercises.length });
    const location = getRoutineLocationSummary(routine.exercises);

    return location ? t('challengeInfo.exerciseSummary', { exercises: exercisesLabel, location }) : exercisesLabel;
  }

  // Activity Color System v2 — the assigned routine's own dominant activity
  // color (routineBuilderStore.ts's getPrimaryActivityType(), computed
  // client-side the moment exercises are added, same "count by category,
  // most frequent wins" logic the backend uses for a submitted challenge).
  // Falls back to `colors.primary` (white) for a rest day, an empty day, or
  // a routine with no exercises yet.
  function getDayRoutineColor(dayNumber: number) {
    const routine = routinesByDay[dayNumber];
    if (!routine || routine.isRestDay || !routine.primaryActivity) {
      return colors.primary;
    }
    return activityColors[routine.primaryActivity];
  }

  // Activity Color System v2 — the whole challenge's own dominant activity
  // color, computed client-side for the Review step (no challenge exists
  // server-side yet to read `dominant_activity_category` from). Mirrors the
  // backend's decided algorithm: tally every exercise across every assigned
  // cycle day, once per day slot (a routine repeated on multiple days counts
  // multiple times, matching the backend's non-dedup decision), highest
  // count wins. Ties break by the order categories were selected in the
  // Activity & Location step (`selectedCategories`), same tie-break rule the
  // backend uses (`challenge_category_map.order_index`). Falls back to
  // `colors.primary` until at least one non-rest day has exercises.
  const challengeAccentColor = useMemo(() => {
    const counts: Partial<Record<ActivityType, number>> = {};
    for (let day = 1; day <= cycleLengthDays; day += 1) {
      const routine = routinesByDay[day];
      if (!routine || routine.isRestDay) continue;
      for (const exercise of routine.exercises) {
        counts[exercise.activityType] = (counts[exercise.activityType] ?? 0) + 1;
      }
    }

    const entries = Object.entries(counts) as [ActivityType, number][];
    if (entries.length === 0) return colors.primary;

    const tieBreakOrder = selectedCategories
      .map((category) => CATEGORY_TO_ACTIVITY[category])
      .filter((type): type is ActivityType => Boolean(type));

    entries.sort((a, b) => (
      b[1] !== a[1] ? b[1] - a[1] : tieBreakOrder.indexOf(a[0]) - tieBreakOrder.indexOf(b[0])
    ));

    return activityColors[entries[0][0]];
  }, [cycleLengthDays, routinesByDay, selectedCategories]);

  return {
    title,
    description,
    cycleLengthDays,
    durationDays,
    startWeekday,
    visibility,
    selectedCategories,
    selectedLocations,
    currentStep,
    activeStep,
    steps,
    progress: (currentStep + 1) / steps.length,
    isReviewStep,
    isFinalStep,
    activeStepErrors,
    isFormComplete,
    missingConfigurationFields,
    setTitle: handleChangeTitle,
    titleError: titleErrors.title?.message,
    onBlurTitle: handleBlurTitle,
    setDescription,
    addCycleDay,
    removeCycleDay,
    setCycleLengthDays,
    setDurationDays,
    setVisibility,
    setCurrentStep,
    isSubmitting,
    hasRoutineForEveryDay,
    firstUnfilledDay,
    getDayStatus,
    getDayRoutineLabel,
    getDayRoutineMeta,
    getDayRoutineColor,
    challengeAccentColor,
    handleBack,
    handleNext,
    handleActionPress,
    toggleCategory,
    toggleLocation,
    openDayRoutineSelector,
  };
}
