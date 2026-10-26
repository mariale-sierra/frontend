import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { Stack } from '../../components/layout/stack';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { LogMetricsExerciseCard } from '../../components/add/logMetricsExerciseCard';
import { CreateFlowPrimaryButton } from '../../components/challenge/create';
import { CoachMark } from '../../components/onboarding/CoachMark';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { useMetricsScreen } from '../../hooks/useMetricsScreen';
import { countAdjustedSets } from '../../services/adapters/index';
import { getChallengeGlowColor } from '../../services/adapters/challengeState';
import { hasSeenLogScreenCoachMark, markLogScreenCoachMarkSeen } from '../../utils/logScreenCoachMark';
import { FORCE_SHOW_ONBOARDING_PREVIEWS } from '../../constants/onboardingDebug';
import { LocationSwitchSheet } from '../../components/challenge/detail/LocationSwitchSheet';

export default function Metrics() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    challenges,
    selectedChallengeId,
    exerciseMetrics,
    isLoadingData,
    challengeLoadError,
    currentDay,
    routineName,
    adaptation,
    adaptationInvalid,
    routineId,
    baseExercises,
    applyLocation,
    resetLocation,
    updateMetricValue,
    goToCamera,
    goToRestDay,
    goBack,
  } = useMetricsScreen();

  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const selectedChallenge = challenges.find((challenge) => challenge.id === selectedChallengeId) ?? challenges[0];
  const hasChallenges = challenges.length > 0;
  const isEmpty = !isLoadingData && !challengeLoadError && !hasChallenges;
  // Home's background turned upside down: the paper light in the challenge's own
  // color, rising from the BOTTOM edge (behind the Log day bar). Home pages it
  // across its carousel; here there's one challenge, so one page that never scrolls.
  // `soft`: a fainter, more blended light than Home's (SOFT_TINTED_GRADIENT).
  const accentColor = getChallengeGlowColor('active', selectedChallenge?.dominantActivityCategory);
  const staticScrollX = useRef(new Animated.Value(0)).current;
  const backgroundPages = useMemo(
    () => ({ colors: [accentColor], scrollX: staticScrollX, pageWidth: 0, soft: true }),
    [accentColor, staticScrollX],
  );
  const totalAdjusted = exerciseMetrics.reduce((sum, exercise) => sum + countAdjustedSets(exercise), 0);

  // Onboarding Stage 5's coach mark — teaches the non-obvious part of this
  // screen's flow (the "Log day" button leads to a quick confirmation photo
  // next, it doesn't save directly), shown once ever per device
  // (utils/logScreenCoachMark.ts), same shape as Stages 2-4's coach marks.
  const [showLogScreenCoachMark, setShowLogScreenCoachMark] = useState(false);
  useEffect(() => {
    if (FORCE_SHOW_ONBOARDING_PREVIEWS) {
      setShowLogScreenCoachMark(true);
      return;
    }
    hasSeenLogScreenCoachMark().then((seen) => {
      if (!seen) setShowLogScreenCoachMark(true);
    });
  }, []);
  function dismissLogScreenCoachMark() {
    setShowLogScreenCoachMark(false);
    markLogScreenCoachMarkSeen();
  }

  function renderContent() {
    if (isLoadingData) {
      return (
        <View style={styles.stateWrap}>
          <ActivityIndicator color={withAlpha(colors.paper, textOpacity.secondary)} />
        </View>
      );
    }

    if (challengeLoadError) {
      return (
        <View style={styles.stateWrap}>
          <Text tone="secondary" align="center">{t('metrics.alerts.submitErrorFallback')}</Text>
        </View>
      );
    }

    if (isEmpty) {
      return (
        <View style={styles.stateWrap}>
          <Text tone="secondary" align="center">{t('logMetrics.pickChallenge.emptyMessage')}</Text>
        </View>
      );
    }

    if (exerciseMetrics.length === 0) {
      return (
        <View style={styles.stateWrap}>
          <Text tone="secondary" align="center">{t('logMetrics.entry.noExercises')}</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Stack gap="base">
          {exerciseMetrics.map((exercise) => (
            <LogMetricsExerciseCard
              key={exercise.id}
              exercise={exercise}
              onChangeValue={(rowIndex, field, nextValue) =>
                updateMetricValue(exercise.id, rowIndex, field, String(nextValue))
              }
            />
          ))}
        </Stack>
      </ScrollView>
    );
  }

  return (
    <ScreenBackground
      variant="default"
      applyTopInset={false}
      gradientBackground
      gradientEdge="bottom"
      gradientPages={backgroundPages}
    >

      <Row justify="space-between" align="center" style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <Pressable
          onPress={goBack}
          hitSlop={12}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={t('common.actions.back')}
        >
          <Icon name="chevron-back-outline" size={24} color={colors.paper} />
        </Pressable>
        <Pressable
          onPress={goToRestDay}
          style={({ pressed }) => [styles.restDayButton, pressed && styles.restDayButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('challenges.restDay')}
        >
          <Icon name="moon-outline" size={16} color={colors.ink} />
          <Text variant="label" weight="bold" style={styles.restDayButtonText}>
            {t('challenges.restDay')}
          </Text>
        </Pressable>
      </Row>

      <View style={styles.titleBlock}>
        <Text variant="header" size="xs" numberOfLines={1} style={styles.eyebrow}>
          {selectedChallenge?.label ?? ''}
        </Text>
        <Text variant="title" numberOfLines={2}>
          {routineName
            ? t('logMetrics.entry.dayWithRoutine', { day: currentDay ?? 1, routine: routineName })
            : t('logMetrics.pickChallenge.dayLabel', { day: currentDay ?? 1 })}
        </Text>
        {adaptation && (
          <Text variant="caption" tone="secondary">
            {t('challengeRoutineDay.location.yourVersion', { location: adaptation.locationName })}
          </Text>
        )}
        {adaptationInvalid && (
          <Text variant="caption" tone="secondary">{t('challengeRoutineDay.location.invalidSwaps')}</Text>
        )}
        {routineId != null && baseExercises.length > 0 && !isLoadingData && (
          <Pressable
            onPress={() => setLocationSheetVisible(true)}
            style={({ pressed }) => [styles.locationButton, pressed && styles.restDayButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel={t('challengeRoutineDay.location.changeA11y')}
            testID="metrics-change-location"
          >
            <Icon name="location-outline" size={16} color={colors.primary} />
            <Text variant="label" weight="bold" style={styles.locationButtonText}>
              {adaptation
                ? t('challengeRoutineDay.location.trainingAt', { location: adaptation.locationName })
                : t('challengeRoutineDay.location.sheetTitle')}
            </Text>
            <Icon name="chevron-down-outline" size={14} color={colors.primary} />
          </Pressable>
        )}
      </View>

      <View style={styles.contentWrap}>{renderContent()}</View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {showLogScreenCoachMark && hasChallenges && (
          <CoachMark
            message={t('logMetrics.entry.logCoachMark')}
            onDismiss={dismissLogScreenCoachMark}
            arrowPlacement="none"
          />
        )}
        <Text variant="caption" tone="secondary" align="center">
          {t('logMetrics.entry.footerCaption', { count: totalAdjusted })}
        </Text>
        <CreateFlowPrimaryButton
          onPress={goToCamera}
          label={t('logMetrics.entry.logDayCta')}
          disabled={!hasChallenges}
        />
      </View>
      <LocationSwitchSheet
        visible={locationSheetVisible}
        onClose={() => setLocationSheetVisible(false)}
        routineId={routineId}
        exercises={baseExercises}
        current={adaptation}
        onApply={applyLocation}
        onReset={resetLocation}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing.base,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.big,
    backgroundColor: colors.rest,
  },
  restDayButtonPressed: {
    opacity: 0.85,
  },
  restDayButtonText: {
    color: colors.ink,
    opacity: 1,
  },
  titleBlock: {
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    paddingBottom: spacing.base,
  },
  locationButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.big,
    backgroundColor: withAlpha(colors.paper, 0.08),
  },
  locationButtonText: {
    color: colors.primary,
    opacity: 1,
  },
  eyebrow: {
    color: colors.primary,
    opacity: 1,
  },
  contentWrap: {
    flex: 1,
    paddingTop: spacing.base,
  },
  scroll: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'] + 132,
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  bottomBar: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
});
