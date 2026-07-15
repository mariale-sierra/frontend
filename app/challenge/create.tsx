import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { Stack } from '../../components/layout/stack';
import {
  CycleDayVerticalStepper,
  CreateFlowPrimaryButton,
  ChallengeSubmitActions,
  ChallengeTitleInputs,
  ChallengeVisibilitySection,
  CreateChallengeHeader,
  DurationStepper,
  OptionSelectionPanel,
  OptionInfoModal,
  type OptionInfoModalState,
} from '../../components/challenge/create';
import { ActivityIcon } from '../../components/icons/activityIcon';
import { LocationIcon, type LocationType } from '../../components/icons/locationIcon';
import { Text } from '../../components/ui/text';
import { colors, radius, spacing, type ActivityType } from '../../constants/theme';
import { CATEGORY_OPTIONS, LOCATION_OPTIONS, VISIBILITY_OPTIONS } from '../../constants/challengeCreateOptions';
import { useCreateChallengeFlow } from '../../hooks/useCreateChallengeFlow';
import { useTranslation } from 'react-i18next';

export default function CreateChallenge() {
  const { t } = useTranslation();
  const [activeOptionInfo, setActiveOptionInfo] = useState<OptionInfoModalState | null>(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);
  const {
    title,
    description,
    cycleDuration,
    visibility,
    selectedCategories,
    selectedLocations,
    activeStep,
    progress,
    activeStepErrors,
    effectiveChallengeDuration,
    configuredDays,
    selectedDay,
    selectedDayRoutine,
    isFormComplete,
    isSubmitting,
    setTitle,
    setDescription,
    setCycleDuration,
    setChallengeDuration,
    setVisibility,
    setCurrentStep,
    setSelectedDay,
    getDayStatus,
    getDayRoutineLabel,
    getDayRoutineDescription,
    handleBack,
    handleNext,
    handleActionPress,
    toggleCategory,
    toggleLocation,
    openDayRoutineSelector,
    unassignRoutineFromDay,
  } = useCreateChallengeFlow();

  const weekGroups = useMemo(() => {
    const totalWeeks = Math.max(1, Math.ceil(cycleDuration / 7));
    return Array.from({ length: totalWeeks }, (_, index) => {
      const startDay = index * 7 + 1;
      const endDay = Math.min(cycleDuration, startDay + 6);
      return Array.from({ length: Math.max(0, endDay - startDay + 1) }, (_item, offset) => startDay + offset);
    });
  }, [cycleDuration]);

  const activeWeekDays = weekGroups[selectedWeekIndex] ?? [];
  const showWeekGrouping = cycleDuration > 7;
  const isDaysStep = activeStep.kind === 'days';
  const isReviewStep = activeStep.kind === 'review';

  useEffect(() => {
    const activeIndex = Math.floor((Math.max(1, selectedDay) - 1) / 7);
    setSelectedWeekIndex(Math.min(activeIndex, Math.max(0, weekGroups.length - 1)));
  }, [selectedDay, weekGroups.length]);

  function handleSelectWeek(index: number) {
    setSelectedWeekIndex(index);
    setWeekPickerOpen(false);

    const days = weekGroups[index] ?? [];
    if (days.length === 0) {
      return;
    }

    if (!days.includes(selectedDay)) {
      setSelectedDay(days[0]);
    }
  }

  function handleDaysContinue() {
    if (!selectedDayRoutine) {
      openDayRoutineSelector(selectedDay);
      return;
    }

    if (selectedDay < cycleDuration) {
      setSelectedDay(selectedDay + 1);
      return;
    }

    handleNext();
  }

  function renderStepContent() {
    switch (activeStep.kind) {
      case 'identity':
        return (
          <ChallengeTitleInputs
            title={title}
            description={description}
            onChangeTitle={setTitle}
            onChangeDescription={setDescription}
          />
        );

      case 'categories':
        return (
          <Stack gap="2xl">
            <OptionSelectionPanel
              title={t('challengeCreate.categories.exerciseCategoriesTitle')}
              subtitle={t('challengeCreate.categories.exerciseCategoriesSubtitle')}
              options={CATEGORY_OPTIONS}
              selectedValues={selectedCategories}
              onToggle={toggleCategory}
              onPressInfo={(option) => {
                setActiveOptionInfo({
                  label: option.label,
                  description: option.description,
                  icon: <ActivityIcon type={option.type as ActivityType} size="lg" variant="circle" />,
                });
              }}
              renderIcon={(option, size) => <ActivityIcon type={option.type as ActivityType} size={size} variant="circle" />}
            />

            <OptionSelectionPanel
              title={t('challengeCreate.categories.challengeLocationTitle')}
              subtitle={t('challengeCreate.categories.challengeLocationSubtitle')}
              options={LOCATION_OPTIONS}
              selectedValues={selectedLocations}
              onToggle={toggleLocation}
              onPressInfo={(option) => {
                setActiveOptionInfo({
                  label: option.label,
                  description: option.description,
                  icon: <LocationIcon type={option.type as LocationType} size="lg" />,
                });
              }}
              renderIcon={(option, size) => <LocationIcon type={option.type as LocationType} size={size} />}
            />
          </Stack>
        );

      case 'cycle':
        return (
          <DurationStepper
            label={t('challengeCreate.fields.cycleDuration')}
            value={cycleDuration}
            unitLabel={t('challengeCreate.fields.cycleDaysUnit')}
            presetValues={[3, 5, 7, 14]}
            presetLabels={{ 7: t('challengeCreate.fields.oneWeek'), 14: t('challengeCreate.fields.twoWeeks') }}
            onIncrement={() => setCycleDuration(cycleDuration + 1)}
            onDecrement={() => setCycleDuration(Math.max(1, cycleDuration - 1))}
            onSelectPreset={setCycleDuration}
          />
        );

      case 'days':
        return (
          <Stack gap="lg">
            <Row justify="space-between" align="center">
              <View>
                <Text variant="caption" style={styles.summaryLabel}>{t('challengeCreate.days.configured')}</Text>
                <Text variant="subheader">
                  {t('challengeCreate.days.configuredCount', {
                    configured: configuredDays.length,
                    total: cycleDuration,
                  })}
                </Text>
              </View>
            </Row>

            {showWeekGrouping && (
              <View style={styles.weekPickerWrap}>
                <Pressable
                  onPress={() => setWeekPickerOpen((current) => !current)}
                  style={({ pressed }) => [styles.weekPickerButton, pressed && styles.pressed]}
                >
                  <Text variant="label" style={styles.weekPickerLabel}>{t('challengeCreate.days.weekLabel', { number: selectedWeekIndex + 1 })}</Text>
                  <Ionicons name={weekPickerOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textPrimary} />
                </Pressable>

                {weekPickerOpen && (
                  <View style={styles.weekPickerList}>
                    {weekGroups.map((_week, index) => {
                      const active = index === selectedWeekIndex;
                      return (
                        <Pressable
                          key={`week-option-${index}`}
                          onPress={() => handleSelectWeek(index)}
                          style={({ pressed }) => [
                            styles.weekPickerOption,
                            active && styles.weekPickerOptionActive,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text variant="body" style={styles.weekPickerOptionLabel}>{t('challengeCreate.days.weekLabel', { number: index + 1 })}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            <CycleDayVerticalStepper
              days={showWeekGrouping ? activeWeekDays : Array.from({ length: cycleDuration }, (_item, index) => index + 1)}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              getDayStatus={getDayStatus}
              getDayRoutineLabel={getDayRoutineLabel}
              getDayRoutineDescription={getDayRoutineDescription}
              onPressAssignRoutine={openDayRoutineSelector}
            />
          </Stack>
        );

      case 'settings':
        return (
          <ChallengeVisibilitySection
            baseDuration={cycleDuration}
            challengeDuration={effectiveChallengeDuration}
            visibilityOptions={VISIBILITY_OPTIONS}
            selectedVisibility={visibility}
            onChangeChallengeDuration={(value) => setChallengeDuration(value > 0 ? value : null)}
            onChangeVisibility={(value) => {
              if (value === 'Public' || value === 'Private' || value == null) {
                setVisibility(value);
              }
            }}
          />
        );

      case 'review':
        return (
          <Stack gap="lg">
            <View style={styles.summaryContent}>
              <Stack gap="md">
                <View>
                  <Text variant="caption" style={styles.summaryLabel}>{t('challengeCreate.review.challengeLabel')}</Text>
                  <Text variant="title" style={styles.summaryTitle}>{title || t('challengeCreate.review.untitledChallenge')}</Text>
                  {description.trim().length > 0 && (
                    <Text variant="body" tone="secondary">{description}</Text>
                  )}
                </View>

                <View style={styles.summaryDivider} />

                <Row justify="space-between" align="flex-start" style={styles.summaryRow}>
                  <View style={styles.summaryMetricBlock}>
                    <Text variant="caption" style={styles.summaryLabel}>{t('challengeCreate.review.categoriesLabel')}</Text>
                    <Text variant="body" style={styles.summaryValueText}>{selectedCategories.join(' · ') || t('challengeCreate.review.noneSelected')}</Text>
                  </View>
                  <View style={styles.summaryMetricBlock}>
                    <Text variant="caption" style={styles.summaryLabel}>{t('challengeCreate.review.locationLabel')}</Text>
                    <Text variant="body" style={styles.summaryValueText}>{selectedLocations.join(' · ') || t('challengeCreate.review.noneSelected')}</Text>
                  </View>
                </Row>

                <View style={styles.summaryDivider} />

                <Row justify="space-between" align="flex-start" style={styles.summaryRow}>
                  <View style={styles.summaryMetricBlock}>
                    <Text variant="caption" style={styles.summaryLabel}>{t('challengeCreate.review.cycleLabel')}</Text>
                    <Text variant="body" style={styles.summaryValueText}>{t('challengeCreate.review.daysValue', { days: cycleDuration })}</Text>
                  </View>
                  <View style={styles.summaryMetricBlock}>
                    <Text variant="caption" style={styles.summaryLabel}>{t('challengeCreate.review.challengeDurationLabel')}</Text>
                    <Text variant="body" style={styles.summaryValueText}>{t('challengeCreate.review.daysValue', { days: effectiveChallengeDuration })}</Text>
                  </View>
                </Row>

                <View style={styles.summaryDivider} />

                <View>
                  <Text variant="caption" style={styles.summaryLabel}>{t('challengeCreate.review.visibilityLabel')}</Text>
                  <Text variant="body" style={styles.summaryValueText}>{visibility ?? t('challengeCreate.review.notSelectedYet')}</Text>
                </View>
              </Stack>
            </View>

            <View style={styles.actionsBlock}>
              <ChallengeSubmitActions
                visibility={visibility ?? 'Public'}
                loading={isSubmitting}
                onPrimaryPress={() => handleActionPress(
                  visibility === 'Private'
                    ? t('challengeCreate.submit.primaryPrivate')
                    : t('challengeCreate.submit.primaryPublic'),
                )}
                onSendToFriendsPress={() => handleActionPress(t('challengeCreate.actions.sendToFriends'))}
                onSharePress={() => handleActionPress(t('challengeCreate.actions.share'))}
              />

              {!isFormComplete && (
                <Text variant="caption" style={styles.actionsHint}>
                  {t('challengeCreate.submit.incompleteHint')}
                </Text>
              )}
            </View>
          </Stack>
        );
    }
  }

  return (
    <ScreenBackground variant="top">
      <ScrollView contentContainerStyle={[styles.container, !isReviewStep && styles.containerWithFixedBottom]}>
        <Stack gap="md">
          <CreateChallengeHeader author="Cami" />

          <View style={styles.progressHeader}>
            <Row justify="flex-start" align="center" style={styles.progressNavRow}>
              <Pressable onPress={handleBack} hitSlop={12} style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
                <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
              </Pressable>
            </Row>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>

          <Stack gap="sm">
            <Text variant="label" style={styles.stepEyebrow}>{activeStep.eyebrow}</Text>
            <Text variant="title" style={styles.stepTitle}>{activeStep.title}</Text>
            <Text variant="body" tone="secondary" style={styles.stepDescription}>{activeStep.description}</Text>
          </Stack>

          <View style={styles.stepContent}>
            {renderStepContent()}
          </View>

          <OptionInfoModal
            info={activeOptionInfo}
            onClose={() => setActiveOptionInfo(null)}
          />


        </Stack>
      </ScrollView>

      {!isReviewStep && (
        <View style={styles.fixedBottomBar}>
          <CreateFlowPrimaryButton
            onPress={isDaysStep ? handleDaysContinue : handleNext}
            label={activeStep.kind === 'settings'
              ? t('challengeCreate.actions.reviewChallenge')
              : t('common.actions.continue')}
          />
        </View>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  containerWithFixedBottom: {
    paddingBottom: spacing['2xl'] + 132,
  },
  progressHeader: {
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  progressNavRow: {
    width: '100%',
  },
  navButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.textPrimary,
  },
  stepEyebrow: {
    color: 'rgba(255,255,255,0.62)',
  },
  stepTitle: {
    maxWidth: '88%',
  },
  stepDescription: {
    maxWidth: '92%',
  },
  stepContent: {
    marginTop: spacing.xl + spacing.md,
  },
  weekPickerWrap: {
    zIndex: 10,
  },
  weekPickerButton: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekPickerLabel: {
    color: colors.textPrimary,
  },
  weekPickerList: {
    marginTop: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  weekPickerOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  weekPickerOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  weekPickerOptionLabel: {
    color: colors.textPrimary,
  },
  summaryContent: {
    paddingHorizontal: spacing.xs,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.56)',
    marginBottom: spacing.xs,
  },
  summaryTitle: {
    marginBottom: spacing.xs,
  },
  summaryDivider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  summaryRow: {
    width: '100%',
    gap: spacing.md,
  },
  summaryMetricBlock: {
    flex: 1,
  },
  summaryValueText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  actionsBlock: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  actionsHint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.62)',
  },
  footerActions: {
    marginTop: spacing['2xl'] + spacing.lg,
    gap: spacing.md,
  },
  footerButtonRow: {
    width: '100%',
  },
  secondaryNavButton: {
    flex: 1,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  primaryNavButton: {
    flex: 1.4,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.textPrimary,
  },
  secondaryNavLabel: {
    color: colors.textPrimary,
  },
  primaryNavLabel: {
    color: colors.textInverse,
  },
  fixedBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: 'rgba(7,10,16,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
  pressed: {
    opacity: 0.82,
  },
});