import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Stack } from '../../components/layout/stack';
import {
  CreateFlowProgressHeader,
  ChallengeNameFields,
  OptionPillGrid,
  CycleDayList,
  RepeatsStepper,
  VisibilityCardGroup,
  ChallengeReviewSummary,
  CreateFlowPrimaryButton,
} from '../../components/challenge/create';
import { ActivityIcon } from '../../components/icons/activityIcon';
import { LocationIcon } from '../../components/icons/locationIcon';
import { Text } from '../../components/ui/text';
import { colors, spacing, activityColors } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { CATEGORY_OPTIONS, LOCATION_OPTIONS } from '../../constants/challengeCreateOptions';
import { useCreateChallengeFlow } from '../../hooks/useCreateChallengeFlow';
import { getExerciseCount } from '../../services/exercises/exercises.service';

export default function CreateChallenge() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
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
    isSubmitting,
    hasRoutineForEveryDay,
    setTitle,
    setDescription,
    addCycleDay,
    removeCycleDay,
    setCyclesCount,
    setVisibility,
    setCurrentStep,
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
  } = useCreateChallengeFlow();

  const isCycleStep = activeStep.kind === 'cycle';
  const isReviewStep = activeStep.kind === 'review';
  const continueDisabled = isCycleStep && !hasRoutineForEveryDay;

  // Live "N exercises unlocked" count for the Activity & Location step (GET
  // /exercises/count, backend added 2026-08-29, commit `bfd502f`) — was
  // entirely unbuilt before that, no endpoint existed to back it.
  const [matchingExerciseCount, setMatchingExerciseCount] = useState<number | null>(null);

  useEffect(() => {
    if (activeStep.kind !== 'activityLocation') return;

    let cancelled = false;
    getExerciseCount(selectedCategories, selectedLocations)
      .then((count) => {
        if (!cancelled) setMatchingExerciseCount(count);
      })
      .catch((error: any) => {
        console.error('[CreateChallenge] Failed to load exercise count:', error?.response?.data ?? error?.message);
        if (!cancelled) setMatchingExerciseCount(null);
      });

    return () => {
      cancelled = true;
    };
  }, [activeStep.kind, selectedCategories, selectedLocations]);

  function renderStepContent() {
    switch (activeStep.kind) {
      case 'name':
        return (
          <ChallengeNameFields
            title={title}
            description={description}
            onChangeTitle={setTitle}
            onChangeDescription={setDescription}
          />
        );

      case 'activityLocation':
        return (
          <Stack gap="xl">
            <OptionPillGrid
              label={t('challengeCreate.fields.activity')}
              options={CATEGORY_OPTIONS}
              selectedValues={selectedCategories}
              onToggle={toggleCategory}
              renderIcon={(option, selected) => (
                <ActivityIcon type={option.type} size="sm" variant="plain" color={selected ? colors.ink : colors.paper} />
              )}
              getSelectedFill={(option) => activityColors[option.type]}
            />

            <OptionPillGrid
              label={t('challengeCreate.fields.location')}
              options={LOCATION_OPTIONS}
              selectedValues={selectedLocations}
              onToggle={toggleLocation}
              renderIcon={(option, selected) => (
                <LocationIcon type={option.type} size="sm" variant="plain" color={selected ? colors.ink : colors.paper} />
              )}
            />

            {matchingExerciseCount !== null && (
              <Text variant="caption" tone="secondary" align="center">
                {t('challengeCreate.fields.exercisesUnlockedCount', { count: matchingExerciseCount })}
              </Text>
            )}
          </Stack>
        );

      case 'cycle':
        return (
          <CycleDayList
            totalDays={cycleLengthDays}
            getDayStatus={getDayStatus}
            getDayRoutineLabel={getDayRoutineLabel}
            getDayRoutineMeta={getDayRoutineMeta}
            getDayRoutineColor={getDayRoutineColor}
            onPressDay={openDayRoutineSelector}
            onRemoveDay={removeCycleDay}
            onAddDay={addCycleDay}
          />
        );

      case 'durationVisibility':
        return (
          <Stack gap="xl">
            <RepeatsStepper
              cycleLengthDays={cycleLengthDays}
              cyclesCount={cyclesCount}
              durationDays={durationDays}
              endDateLabel={endDateLabel}
              onIncrement={() => setCyclesCount(cyclesCount + 1)}
              onDecrement={() => setCyclesCount(cyclesCount - 1)}
            />

            <VisibilityCardGroup selectedVisibility={visibility} onChange={setVisibility} />
          </Stack>
        );

      case 'review':
        return (
          <ChallengeReviewSummary
            title={title}
            cycleLengthDays={cycleLengthDays}
            cyclesCount={cyclesCount}
            durationDays={durationDays}
            visibility={visibility}
            selectedCategories={derivedCategories}
            selectedLocations={derivedLocations}
            getDayStatus={getDayStatus}
            getDayRoutineLabel={getDayRoutineLabel}
            accentColor={challengeAccentColor}
            onEditCycle={() => setCurrentStep(1)}
          />
        );
    }
  }

  return (
    <ScreenBackground variant="top">
      <ScrollView contentContainerStyle={styles.container}>
        <Stack gap="lg">
          <CreateFlowProgressHeader
            currentIndex={currentStep}
            total={steps.length}
            stepLabel={t('challengeCreate.stepLabel', { current: currentStep + 1, total: steps.length })}
            onBack={handleBack}
          />

          <Stack gap="sm">
            <Text variant="title">{activeStep.title}</Text>
            <Text variant="body" tone="secondary">{activeStep.description}</Text>
          </Stack>

          <View style={styles.stepContent}>
            {renderStepContent()}
          </View>
        </Stack>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {isCycleStep && !hasRoutineForEveryDay && (
          <Text variant="caption" tone="secondary" align="center" style={styles.bottomHint}>
            {t('challengeCreate.cycle.setAllDaysHint', { count: cycleLengthDays })}
          </Text>
        )}

        {isReviewStep && (
          <Text variant="caption" tone="secondary" align="center" style={styles.bottomHint}>
            {t('challengeCreate.review.firstMemberHint')}
          </Text>
        )}

        <CreateFlowPrimaryButton
          label={isReviewStep ? t('challengeCreate.submit.startChallenge') : t('common.actions.continue')}
          loading={isReviewStep ? isSubmitting : false}
          disabled={continueDisabled}
          onPress={isReviewStep ? handleActionPress : handleNext}
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'] + 132,
    flexGrow: 1,
  },
  stepContent: {
    marginTop: spacing.sm,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
  bottomHint: {
    marginTop: spacing.xs,
  },
});
