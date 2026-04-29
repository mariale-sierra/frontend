import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/layout/screenBackground';
import { GradientBox } from '../../components/layout/gradient-box';
import { Row } from '../../components/layout/row';
import { Stack } from '../../components/layout/stack';
import {
  CycleDayAssignmentPanel,
  CycleDayTimelineStepper,
  ChallengeSubmitActions,
  ChallengeTitleInputs,
  ChallengeVisibilitySection,
  CreateChallengeHeader,
  DurationStepper,
} from '../../components/create';
import { ActivityIcon } from '../../components/icons/activityIcon';
import { LocationIcon, type LocationType } from '../../components/icons/locationIcon';
import { Text } from '../../components/ui/text';
import { colors, gradients, radius, spacing, type ActivityType } from '../../constants/theme';
import { useCreateChallengeFlow } from '../../hooks/useCreateChallengeFlow';
import { useTranslation } from 'react-i18next';

// MOCK ONLY: category and location option lists should come from backend/database.
// Backend team: send these as reference data so challenge setup is fully server-driven.
const CATEGORY_OPTIONS = [
  { label: 'Strength', value: 'Strength', type: 'strength' as const, description: 'Load-based training focused on force, power, and muscular growth.' },
  { label: 'Cardio Intense', value: 'Cardio Intense', type: 'cardioIntense' as const, description: 'High-effort endurance work that elevates heart rate fast.' },
  { label: 'Cardio Low', value: 'Cardio Low', type: 'cardioLow' as const, description: 'Lower-impact aerobic work built for consistency and recovery.' },
  { label: 'Flexibility', value: 'Flexibility', type: 'flexibility' as const, description: 'Mobility and range-of-motion sessions to improve movement quality.' },
  { label: 'Mind-Body', value: 'Mind-Body', type: 'mindBody' as const, description: 'Practices that blend control, breath, and awareness with training.' },
  { label: 'Functional', value: 'Functional', type: 'functional' as const, description: 'Full-body patterns that transfer to everyday movement and sport.' },
];

const LOCATION_OPTIONS = [
  { label: 'Gym', value: 'Gym', type: 'gym' as const, description: 'Equipment-first sessions built around machines, weights, or racks.' },
  { label: 'Home', value: 'Home', type: 'home' as const, description: 'Minimal-space training designed for home routines and convenience.' },
  { label: 'Outdoor', value: 'Outdoor', type: 'outdoor' as const, description: 'Running, field work, or open-air movement with more space.' },
  { label: 'Studio', value: 'Studio', type: 'studio' as const, description: 'Class-like sessions for guided formats such as yoga or pilates.' },
  { label: 'Anywhere', value: 'Anywhere', type: 'anywhere' as const, description: 'Flexible setups that can be completed in almost any environment.' },
];

const VISIBILITY_OPTIONS = ['Public', 'Private'];

interface SelectionPanelProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

interface OptionCardProps {
  label: string;
  description: string;
  selected: boolean;
  icon: ReactNode;
  onPress: () => void;
}

interface DayPlanReviewSummaryProps {
  daySummaries: string[];
  onPressConfigure: () => void;
}

interface SelectableOptionBase {
  label: string;
  value: string;
  description: string;
}

function SelectionPanel({ title, subtitle, children }: SelectionPanelProps) {
  return (
    <GradientBox
      colors={gradients.surface.colors}
      start={gradients.surface.start}
      end={gradients.surface.end}
      style={styles.selectionPanel}
    >
      <Stack gap="md">
        <View>
          <Text variant="subheader">{title}</Text>
          <Text variant="body" tone="secondary" style={styles.selectionPanelSubtitle}>{subtitle}</Text>
        </View>
        {children}
      </Stack>
    </GradientBox>
  );
}

function OptionCard({ label, description, selected, icon, onPress }: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.optionCard, selected && styles.optionCardSelected, pressed && styles.pressed]}
    >
      {selected && (
        <View style={styles.optionCheckIcon}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
        </View>
      )}
      <View style={styles.optionIconShell}>{icon}</View>
      <Text variant="body" style={styles.optionTitle}>{label}</Text>
      <Text variant="caption" style={styles.optionDescription}>{description}</Text>
    </Pressable>
  );
}

function renderOptionSelectionPanel<TOption extends SelectableOptionBase>(params: {
  title: string;
  subtitle: string;
  options: readonly TOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  renderIcon: (option: TOption) => ReactNode;
}) {
  const {
    title,
    subtitle,
    options,
    selectedValues,
    onToggle,
    renderIcon,
  } = params;

  return (
    <SelectionPanel title={title} subtitle={subtitle}>
      <View style={styles.optionGrid}>
        {options.map((option) => {
          const selected = selectedValues.includes(option.value);
          return (
            <OptionCard
              key={option.value}
              label={option.label}
              description={option.description}
              selected={selected}
              icon={renderIcon(option)}
              onPress={() => onToggle(option.value)}
            />
          );
        })}
      </View>
    </SelectionPanel>
  );
}

function DayPlanReviewSummary({
  daySummaries,
  onPressConfigure,
}: DayPlanReviewSummaryProps) {
  const { t } = useTranslation();

  return (
    <GradientBox
      colors={gradients.surfaceReverse.colors}
      start={gradients.surfaceReverse.start}
      end={gradients.surfaceReverse.end}
      style={styles.planInsightsCard}
    >
      <Stack gap="md">
        <Text variant="subheader">{t('challengeCreate.review.cyclePlanSummary')}</Text>

        <Stack gap="xs">
          {daySummaries.map((item) => (
            <Row key={item} align="center" gap="sm" style={styles.planListRow}>
              <View style={styles.planListBullet} />
              <Text variant="body" style={styles.planListText}>{item}</Text>
            </Row>
          ))}
        </Stack>

        <Pressable onPress={onPressConfigure} style={({ pressed }) => [styles.inlineReviewAction, pressed && styles.pressed]}>
          <Text variant="label" style={styles.inlineReviewActionLabel}>{t('challengeCreate.actions.editDayConfiguration')}</Text>
        </Pressable>
      </Stack>
    </GradientBox>
  );
}

export default function CreateChallenge() {
  const { t } = useTranslation();
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
    daySummaries,
    daysStepIndex,
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
    handleBack,
    handleNext,
    handleActionPress,
    toggleCategory,
    toggleLocation,
    openDayRoutineSelector,
    unassignRoutineFromDay,
  } = useCreateChallengeFlow();

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
          <Stack gap="lg">
            {renderOptionSelectionPanel({
              title: t('challengeCreate.categories.exerciseCategoriesTitle'),
              subtitle: t('challengeCreate.categories.exerciseCategoriesSubtitle'),
              options: CATEGORY_OPTIONS,
              selectedValues: selectedCategories,
              onToggle: toggleCategory,
              renderIcon: (option) => <ActivityIcon type={option.type as ActivityType} size="sm" />,
            })}

            {renderOptionSelectionPanel({
              title: t('challengeCreate.categories.challengeLocationTitle'),
              subtitle: t('challengeCreate.categories.challengeLocationSubtitle'),
              options: LOCATION_OPTIONS,
              selectedValues: selectedLocations,
              onToggle: toggleLocation,
              renderIcon: (option) => <LocationIcon type={option.type as LocationType} size="sm" />,
            })}
          </Stack>
        );

      case 'cycle':
        return (
          <DurationStepper
            label={t('challengeCreate.fields.cycleDuration')}
            value={cycleDuration}
            unitLabel={t('challengeCreate.fields.cycleDaysUnit')}
            presetValues={[3, 5, 7, 14]}
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

            <View style={styles.timelineFullBleed}>
              <CycleDayTimelineStepper
                totalDays={cycleDuration}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                getDayStatus={getDayStatus}
                daysPerRow={7}
              />
            </View>

            <View style={styles.dayAssignmentSpacing}>
              <CycleDayAssignmentPanel
                dayNumber={selectedDay}
                routine={selectedDayRoutine}
                onPressAssign={() => openDayRoutineSelector(selectedDay)}
                onPressRemove={() => unassignRoutineFromDay(selectedDay)}
              />
            </View>
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
            <GradientBox
              colors={gradients.surface.colors}
              start={gradients.surface.start}
              end={gradients.surface.end}
              style={styles.summaryCard}
            >
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
            </GradientBox>

            <DayPlanReviewSummary
              daySummaries={daySummaries}
              onPressConfigure={() => setCurrentStep(daysStepIndex)}
            />

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
      <ScrollView contentContainerStyle={styles.container}>
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

          {activeStep.kind !== 'review' && (
            <View style={styles.footerActions}>
              {activeStepErrors.length > 0 && (
                <Text variant="caption" style={styles.stepErrorText}>
                  {t('challengeCreate.alerts.missingPrefix', { items: activeStepErrors.join(', ') })}
                </Text>
              )}

              <Row gap="sm" style={styles.footerButtonRow}>
                <Pressable onPress={handleBack} style={({ pressed }) => [styles.secondaryNavButton, pressed && styles.pressed]}>
                  <Text variant="label" style={styles.secondaryNavLabel}>{t('common.actions.back')}</Text>
                </Pressable>
                <Pressable onPress={handleNext} style={({ pressed }) => [styles.primaryNavButton, pressed && styles.pressed]}>
                  <Text variant="label" style={styles.primaryNavLabel}>
                    {activeStep.kind === 'settings'
                        ? t('challengeCreate.actions.reviewChallenge')
                        : t('common.actions.continue')}
                  </Text>
                </Pressable>
              </Row>
            </View>
          )}
        </Stack>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  progressHeader: {
    gap: spacing.lg,
  },
  progressNavRow: {
    width: '100%',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
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
  timelineFullBleed: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  dayAssignmentSpacing: {
    marginTop: spacing.md,
  },
  selectionPanel: {
    borderRadius: radius['2xl'],
    padding: spacing.lg,
  },
  selectionPanelSubtitle: {
    marginTop: spacing.xs,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionCard: {
    width: '48%',
    minHeight: 156,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.md,
    gap: spacing.sm,
  },
  optionCardSelected: {
    borderColor: 'rgba(255,255,255,0.34)',
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  optionIconShell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  optionTitle: {
    fontWeight: '600',
  },
  optionDescription: {
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 16,
  },
  optionCheckIcon: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
  },
  summaryCard: {
    borderRadius: radius['2xl'],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.02)',
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
  planInsightsCard: {
    borderRadius: radius['2xl'],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  planListRow: {
    width: '100%',
    paddingVertical: spacing.xs,
  },
  planListBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 3,
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  planListText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  inlineReviewAction: {
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineReviewActionLabel: {
    color: colors.textPrimary,
  },
  actionsBlock: {
    gap: spacing.sm,
  },
  actionsHint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.62)',
  },
  footerActions: {
    marginTop: spacing['2xl'],
    gap: spacing.md,
  },
  stepErrorText: {
    color: colors.error,
    marginBottom: spacing.sm,
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
  pressed: {
    opacity: 0.82,
  },
});