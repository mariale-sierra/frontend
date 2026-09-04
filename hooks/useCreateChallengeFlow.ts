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
import { CATEGORY_TO_ACTIVITY, ACTIVITY_TO_CATEGORY } from '../constants/challengeFilters';
import type { ActivityType } from '../types/activity';
import { useTranslation } from 'react-i18next';
import { createChallengeNameSchema, type ChallengeNameFormValues } from '../validation/challengeSchemas';

export type CreateStep =
  | { kind: 'name'; title: string; description: string }
  | { kind: 'activityLocation'; title: string; description: string }
  | { kind: 'cycle'; title: string; description: string }
  | { kind: 'durationVisibility'; title: string; description: string }
  | { kind: 'review'; title: string; description: string };

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
    case 'cycle':
      return params.hasRoutineForEveryDay ? [] : [params.labels.configureEveryDay];
    case 'durationVisibility':
      return params.visibility ? [] : [params.labels.visibility];
    case 'review':
      return [];
  }
}

export function useCreateChallengeFlow() {
  const { t, i18n } = useTranslation();
  const title = useChallengeBuilder((state) => state.title);
  const description = useChallengeBuilder((state) => state.description);
  const cycleLengthDays = useChallengeBuilder((state) => state.cycleLengthDays);
  const cyclesCount = useChallengeBuilder((state) => state.cyclesCount);
  const visibility = useChallengeBuilder((state) => state.visibility);
  const currentStep = useChallengeBuilder((state) => state.currentStep);
  const selectedCategories = useChallengeBuilder((state) => state.selectedCategories);
  const selectedLocations = useChallengeBuilder((state) => state.selectedLocations);
  const setTitle = useChallengeBuilder((state) => state.setTitle);
  const setDescription = useChallengeBuilder((state) => state.setDescription);
  const addCycleDayInStore = useChallengeBuilder((state) => state.addCycleDay);
  const removeCycleDayInStore = useChallengeBuilder((state) => state.removeCycleDay);
  const setCyclesCount = useChallengeBuilder((state) => state.setCyclesCount);
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
    // 'activityLocation' ("What kind of training?") deprecated 2026-09-04,
    // per explicit request — NOT deleted, just omitted from the step
    // sequence: create.tsx's `case 'activityLocation':` branch, the
    // toggleCategory/toggleLocation actions, and selectedCategories/
    // selectedLocations in the store are all still intact below. Reason:
    // the exercise picker (app/challenge/routine/exercises.tsx) already has
    // its own Categories/Locations/Muscles filters, so asking the user to
    // guess a challenge-wide category/location before they've even picked
    // an exercise was redundant. Categories/locations are now derived AFTER
    // the fact from whichever exercises actually end up in the built
    // routines — see `derivedCategories`/`derivedLocations` below, used for
    // both the Review step's read-only summary and the real submit payload.
    {
      kind: 'cycle',
      title: t('challengeCreate.steps.cycle.title'),
      description: t('challengeCreate.steps.cycle.description'),
    },
    {
      kind: 'durationVisibility',
      title: t('challengeCreate.steps.durationVisibility.title'),
      description: t('challengeCreate.steps.durationVisibility.description'),
    },
    {
      kind: 'review',
      title: t('challengeCreate.steps.review.title'),
      description: t('challengeCreate.steps.review.description'),
    },
  ]), [t]);

  const hasRoutineForEveryDay = useMemo(
    () => Array.from({ length: cycleLengthDays }, (_, index) => index + 1)
      .every((dayNumber) => Boolean(routinesByDay[dayNumber])),
    [cycleLengthDays, routinesByDay],
  );

  const durationDays = cycleLengthDays * cyclesCount;
  const activeStep = steps[Math.min(currentStep, steps.length - 1)];
  const isReviewStep = activeStep.kind === 'review';

  const endDateLabel = useMemo(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays - 1);
    const locale = i18n.language?.startsWith('es') ? 'es-ES' : 'en-US';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(endDate);
  }, [durationDays, i18n.language]);

  const activeStepErrors = getStepErrors(activeStep, {
    title,
    selectedCategories,
    selectedLocations,
    hasRoutineForEveryDay,
    visibility,
    labels: validationLabels,
  });

  // Categories/locations are no longer a manual, independently-validated
  // field (see the 'activityLocation' deprecation note in `steps` above) —
  // they're derived from whatever exercises actually ended up in the
  // routines, so `hasRoutineForEveryDay` (already required below) is the
  // one real gate that also guarantees derivedCategories/derivedLocations
  // end up non-empty in the normal case.
  const missingConfigurationFields = useMemo(() => {
    const missing: string[] = [];

    if (title.trim().length === 0) missing.push(validationLabels.challengeName);
    if (!hasRoutineForEveryDay) missing.push(validationLabels.configureEveryDay);
    if (!visibility) missing.push(validationLabels.visibility);

    return missing;
  }, [
    title,
    hasRoutineForEveryDay,
    visibility,
    validationLabels,
  ]);

  // Derived from the exercises actually picked across every configured
  // cycle day — replaces the old manual selectedCategories/selectedLocations
  // as the real source of truth for both the Review step's read-only
  // summary and the submitted payload. Empty only if every day is a rest
  // day (no exercises anywhere in the cycle).
  const derivedCategories = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (let day = 1; day <= cycleLengthDays; day += 1) {
      const routine = routinesByDay[day];
      if (!routine || routine.isRestDay) continue;
      for (const exercise of routine.exercises) {
        const name = ACTIVITY_TO_CATEGORY[exercise.activityType];
        if (name && !seen.has(name)) {
          seen.add(name);
          result.push(name);
        }
      }
    }
    return result;
  }, [cycleLengthDays, routinesByDay]);

  const derivedLocations = useMemo(() => {
    const exercises = Array.from({ length: cycleLengthDays }, (_, index) => index + 1)
      .flatMap((day) => {
        const routine = routinesByDay[day];
        return routine && !routine.isRestDay ? routine.exercises : [];
      });
    const summary = getRoutineLocationSummary(exercises);
    return summary ? summary.split('/').map((value) => value.trim()).filter(Boolean) : [];
  }, [cycleLengthDays, routinesByDay]);

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
      cyclesCount,
      selectedCategories: derivedCategories,
      selectedLocations: derivedLocations,
      routinesByDay,
    });

    setIsSubmitting(true);
    try {
      const created = await createChallenge(payload);
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
      if (created?.id) {
        router.replace(`/challenge/${created.id}`);
      } else {
        // Fallback for the rare case the create response has no id — the
        // Challenges tab's Mine view (its default) is where a just-created
        // challenge shows up anyway, now that app/challenge/active-all.tsx
        // (the old dedicated screen) is retired.
        router.replace('/(tabs)/challenges');
      }
    } catch (err: unknown) {
      type AxiosLike = {
        response?: { status?: number; data?: { message?: string | string[] } };
        message?: string;
      };
      const e = err as AxiosLike;
      console.error('[createChallenge] error:', err);

      const raw = e?.response?.data?.message;
      const backendMessage = Array.isArray(raw) ? raw.join('\n') : (raw ?? e?.message);
      const statusLabel = e?.response?.status ? `(${e.response.status}) ` : '';
      Alert.alert(
        `${statusLabel}${t('common.errors.genericTitle')}`,
        backendMessage ?? t('challengeCreate.alerts.createFailedMessage'),
      );
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

  function removeCycleDay(dayNumber: number) {
    if (cycleLengthDays <= 1) {
      return;
    }

    removeDayAndShift(dayNumber, cycleLengthDays);
    removeCycleDayInStore();
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
    cyclesCount,
    durationDays,
    endDateLabel,
    visibility,
    selectedCategories,
    selectedLocations,
    derivedCategories,
    derivedLocations,
    currentStep,
    activeStep,
    steps,
    progress: (currentStep + 1) / steps.length,
    isReviewStep,
    activeStepErrors,
    isFormComplete,
    missingConfigurationFields,
    setTitle: handleChangeTitle,
    titleError: titleErrors.title?.message,
    onBlurTitle: handleBlurTitle,
    setDescription,
    addCycleDay,
    removeCycleDay,
    setCyclesCount,
    setVisibility,
    setCurrentStep,
    isSubmitting,
    hasRoutineForEveryDay,
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
