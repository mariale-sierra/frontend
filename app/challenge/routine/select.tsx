import { useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '../../../utils/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Row } from '../../../components/layout/row';
import { Stack } from '../../../components/layout/stack';
import { Text } from '../../../components/ui/text';
import { RoutinePickerCard, RoutineModeToggle } from '../../../components/routine';
import type { RoutineMode } from '../../../components/routine';
import { useRoutineBuilder } from '../../../store/routineBuilderStore';
import { useChallengeBuilder } from '../../../store/challengeBuilderStore';
import { CATEGORY_TO_ACTIVITY } from '../../../constants/challengeFilters';
import type { ActivityType } from '../../../types/activity';
import { colors, radius, spacing, textOpacity, typography } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { useTranslation } from 'react-i18next';

const TRANSITION_DURATION = 380;
const AnimatedText = Animated.createAnimatedComponent(RNText);

export default function SelectRoutineScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { day } = useLocalSearchParams<{ day: string }>();
  const { init, savedRoutines, assignRoutineToDay, assignRestDayToDay } = useRoutineBuilder();
  const selectedCategories = useChallengeBuilder((state) => state.selectedCategories);
  const [mode, setMode] = useState<RoutineMode>('workout');
  // 0 = workout, 1 = rest — the single source every color/position on this
  // screen animates from, so background, toggle, header, and CTA button all
  // move as one coordinated transition instead of independent snaps.
  const progress = useRef(new Animated.Value(0)).current;

  const dayNumber = Number(day ?? '1');

  function handleModeChange(nextMode: RoutineMode) {
    setMode(nextMode);
    Animated.timing(progress, {
      toValue: nextMode === 'rest' ? 1 : 0,
      duration: TRANSITION_DURATION,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }

  // Real bug, fixed 2026-08-29, per explicit report: "existing routine" here
  // showed EVERY routine ever built this session (including the store's own
  // seed/mock "Leg Day for Glute Growth" — always Strength), with no regard
  // for the challenge's own selected activity categories. A Cardio-only
  // challenge could still show and let the user confirm a Strength routine
  // as that day's workout. A routine only counts as pickable now if every
  // exercise's activityType falls within what this challenge allows.
  const allowedActivityTypes = useMemo(
    () => new Set(selectedCategories.map((category) => CATEGORY_TO_ACTIVITY[category]).filter((type): type is ActivityType => Boolean(type))),
    [selectedCategories],
  );
  const workoutRoutines = useMemo(
    () => savedRoutines.filter((routine) => {
      if (routine.isRestDay) return false;
      if (allowedActivityTypes.size === 0) return true;
      return routine.activityTypes.every((type) => allowedActivityTypes.has(type));
    }),
    [savedRoutines, allowedActivityTypes],
  );
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(workoutRoutines[0]?.id ?? null);

  function handleCreateNew() {
    init(dayNumber);
    router.push(`/challenge/routine/create?day=${dayNumber}`);
  }

  function handleViewRoutine(routineId: string) {
    const routine = savedRoutines.find((item) => item.id === routineId);
    init(dayNumber, routine ?? null);
    router.push(`/challenge/routine/create?day=${dayNumber}`);
  }

  function handleConfirmWorkout() {
    if (!selectedRoutineId) {
      return;
    }

    const routine = savedRoutines.find((item) => item.id === selectedRoutineId);
    if (!routine) {
      return;
    }

    assignRoutineToDay(dayNumber, routine);
    safeBack();
  }

  function handleConfirmRestDay() {
    assignRestDayToDay(dayNumber);
    safeBack();
  }

  const isRestMode = mode === 'rest';
  const confirmDisabled = mode === 'workout' && !selectedRoutineId;

  // Every color below is derived from the same `progress` value — a single
  // coordinated interpolation set, not several independently-timed
  // animations. Backgrounds/text/icons all read from `colors.ink`/`paper`/
  // `primary` at progress 0 (workout) to `colors.rest`/`ink` at progress 1
  // (rest day), mirroring exactly what ScreenBackground + RestDayScreenBackground
  // + CreateFlowPrimaryButton + RestDayPrimaryButton render today as two
  // separate discrete states.
  const screenBg = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.ink, colors.rest] });
  const workoutGlowOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const restHighlightOpacity = progress;
  const titleColor = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.paper, colors.ink] });
  const bottomBarBg = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.surface, colors.rest] });
  const bottomBarBorderColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [withAlpha(colors.paper, 0.08), withAlpha(colors.paper, 0)],
  });
  const confirmButtonBg = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.primary, colors.ink] });
  const confirmButtonTextColor = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.ink, colors.rest] });

  return (
    <Animated.View style={[styles.screen, { backgroundColor: screenBg }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: workoutGlowOpacity }]} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="glowPrimary" cx="15%" cy="0%" r="85%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.05} />
              <Stop offset="55%" stopColor={colors.primary} stopOpacity={0.025} />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="glowRest" cx="85%" cy="8%" r="80%">
              <Stop offset="0%" stopColor={colors.rest} stopOpacity={0.045} />
              <Stop offset="55%" stopColor={colors.rest} stopOpacity={0.023} />
              <Stop offset="100%" stopColor={colors.rest} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#glowPrimary)" />
          <Rect width="100%" height="100%" fill="url(#glowRest)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: restHighlightOpacity }]} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="restHighlight" cx="50%" cy="0%" r="60%">
              <Stop offset="0%" stopColor={colors.paper} stopOpacity={0.55} />
              <Stop offset="100%" stopColor={colors.paper} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#restHighlight)" />
        </Svg>
      </Animated.View>

      <View style={[styles.content, { paddingTop: insets.top }]}>
        <Row justify="space-between" align="center" style={styles.topBar}>
          <Pressable onPress={() => safeBack()} style={styles.backButton} hitSlop={8}>
            {/* Crossfading two statically-colored icons instead of animating
                Ionicons' own color directly — react-native-vector-icons'
                Icon class implements its own `setNativeProps` that forwards
                to an internal ref which doesn't support it on this app's
                Fabric setup, crashing the instant Animated tries to update
                it. Animated.View's opacity (a real host-component prop) has
                no such issue, so two overlaid icons + fading opacity gets
                the same smooth color-morph effect safely. */}
            <Animated.View style={[styles.backIconLayer, { opacity: workoutGlowOpacity }]} pointerEvents="none">
              <Ionicons name="chevron-back-outline" size={24} color={colors.paper} />
            </Animated.View>
            <Animated.View style={[styles.backIconLayer, { opacity: restHighlightOpacity }]} pointerEvents="none">
              <Ionicons name="chevron-back-outline" size={24} color={colors.ink} />
            </Animated.View>
          </Pressable>
          <AnimatedText style={[styles.headerTitleText, { color: titleColor }]}>
            {t('routineSelect.dayTitle', { day: dayNumber })}
          </AnimatedText>
          <View style={styles.trailingSpacer} />
        </Row>

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Stack gap="lg">
            <RoutineModeToggle value={mode} onChange={handleModeChange} progress={progress} />

            {mode === 'workout' ? (
              <Stack gap="md">
                <Row justify="space-between" align="center">
                  <Text variant="header" tone="secondary" size="xs">{t('routineSelect.yourRoutines')}</Text>
                  <Text
                    variant="label"
                    weight="bold"
                    onPress={handleCreateNew}
                    style={styles.newWorkoutLink}
                  >
                    {t('routineSelect.newWorkout')}
                  </Text>
                </Row>

                {workoutRoutines.length > 0 ? (
                  <Stack gap="sm">
                    {workoutRoutines.map((routine) => (
                      <RoutinePickerCard
                        key={routine.id}
                        routine={routine}
                        selected={selectedRoutineId === routine.id}
                        onSelect={() => setSelectedRoutineId(routine.id)}
                        onOpen={() => handleViewRoutine(routine.id)}
                      />
                    ))}
                  </Stack>
                ) : (
                  // Fixed 2026-08-29, per explicit "I just want the plain
                  // label not a card" report — was a bordered `surface`-bg box
                  // (see the deleted `emptyState` style below), which read as
                  // its own component rather than a plain empty-state message.
                  // Also now shows more often than before, now that
                  // `workoutRoutines` is correctly filtered by the challenge's
                  // allowed categories (see that filter's own doc comment
                  // above) — a challenge whose categories don't match any
                  // saved routine (e.g. the seed mock, always Strength) hits
                  // this state legitimately, not just on a genuinely fresh
                  // challenge.
                  <Text variant="body" tone="secondary">{t('routineSelect.emptyState')}</Text>
                )}
              </Stack>
            ) : (
              // Rest-Or-Plan-28C wireframe content — same shape as
              // RestDayContent.tsx's choice screen, reused verbatim ("so they
              // match") rather than kept as this screen's own illustration +
              // separate copy.
              <View style={styles.restModeContent}>
                <Ionicons name="moon-outline" size={72} color={colors.ink} />
                <Stack gap="xs" align="center">
                  <Text variant="body" size="2xl" weight="bold" align="center" inverse>
                    {t('restDay.title')}
                  </Text>
                  <Text variant="body" tone="secondary" align="center" inverse style={styles.restModeSubtitle}>
                    {t('routineSelect.restDay.description')}
                  </Text>
                </Stack>
              </View>
            )}
          </Stack>
        </ScrollView>

        <Animated.View
          style={[
            styles.bottomBar,
            {
              backgroundColor: bottomBarBg,
              borderTopColor: bottomBarBorderColor,
              paddingBottom: Math.max(insets.bottom, spacing.lg),
            },
          ]}
        >
          <Pressable
            onPress={isRestMode ? handleConfirmRestDay : handleConfirmWorkout}
            disabled={confirmDisabled}
            style={({ pressed }) => [
              pressed && !confirmDisabled && styles.confirmPressed,
              confirmDisabled && styles.confirmDisabled,
            ]}
          >
            <Animated.View style={[styles.confirmButton, { backgroundColor: confirmButtonBg }]}>
              <AnimatedText style={[styles.confirmButtonText, { color: confirmButtonTextColor }]}>
                {isRestMode ? t('routineSelect.confirmRestDay') : t('routineSelect.confirmRoutine')}
              </AnimatedText>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backButton: {
    marginLeft: -spacing.sm,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['3xl'],
    lineHeight: typography.lineHeight['3xl'],
    letterSpacing: typography.bebasLetterSpacing(typography.fontSize['3xl']),
    opacity: textOpacity.primary,
  },
  trailingSpacer: {
    width: 44,
    height: 44,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'] + 132,
    flexGrow: 1,
  },
  newWorkoutLink: {
    color: colors.primary,
    opacity: 1,
  },
  restModeContent: {
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  restModeSubtitle: {
    maxWidth: 280,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  confirmButton: {
    height: 52,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
  },
  confirmPressed: {
    opacity: 0.82,
  },
  confirmDisabled: {
    opacity: 0.5,
  },
});
