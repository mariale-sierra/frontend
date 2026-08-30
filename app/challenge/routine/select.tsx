import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreateFlowPrimaryButton } from '../../../components/challenge/create';
import ScreenBackground from '../../../components/layout/screenBackground';
import { RestDayScreenBackground } from '../../../components/layout/restDayScreenBackground';
import { Row } from '../../../components/layout/row';
import { Stack } from '../../../components/layout/stack';
import { BackButton } from '../../../components/ui/backButton';
import { Text } from '../../../components/ui/text';
import { RoutinePickerCard, RoutineModeToggle } from '../../../components/routine';
import { RestDayPrimaryButton } from '../../../components/add/restDay/RestDayPrimaryButton';
import { useRoutineBuilder } from '../../../store/routineBuilderStore';
import { useChallengeBuilder } from '../../../store/challengeBuilderStore';
import { CATEGORY_TO_ACTIVITY } from '../../../constants/challengeFilters';
import type { ActivityType } from '../../../types/activity';
import { colors, radius, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { useTranslation } from 'react-i18next';

export default function SelectRoutineScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { day } = useLocalSearchParams<{ day: string }>();
  const { init, savedRoutines, assignRoutineToDay, assignRestDayToDay } = useRoutineBuilder();
  const selectedCategories = useChallengeBuilder((state) => state.selectedCategories);
  const [mode, setMode] = useState<'workout' | 'rest'>('workout');

  const dayNumber = Number(day ?? '1');

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
    router.back();
  }

  function handleConfirmRestDay() {
    assignRestDayToDay(dayNumber);
    router.back();
  }

  const isRestMode = mode === 'rest';

  const content = (
    <>
      <Row justify="space-between" align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} iconColor={isRestMode ? colors.ink : undefined} onPress={() => router.back()} />
        <Text variant="title" align="center" inverse={isRestMode} style={styles.headerTitle}>
          {t('routineSelect.dayTitle', { day: dayNumber })}
        </Text>
        <View style={styles.trailingSpacer} />
      </Row>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Stack gap="lg">
          <RoutineModeToggle value={mode} onChange={setMode} />

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
                <View style={styles.emptyState}>
                  <Text variant="body" tone="secondary">{t('routineSelect.emptyState')}</Text>
                </View>
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

      <View
        style={[
          styles.bottomBar,
          isRestMode && styles.bottomBarRest,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) },
        ]}
      >
        {isRestMode ? (
          <RestDayPrimaryButton label={t('routineSelect.confirmRestDay')} onPress={handleConfirmRestDay} />
        ) : (
          <CreateFlowPrimaryButton
            tone="primary"
            onPress={handleConfirmWorkout}
            disabled={!selectedRoutineId}
            label={t('routineSelect.confirmRoutine')}
          />
        )}
      </View>
    </>
  );

  return isRestMode ? (
    <RestDayScreenBackground>{content}</RestDayScreenBackground>
  ) : (
    <ScreenBackground variant="top">{content}</ScreenBackground>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
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
  emptyState: {
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: withAlpha(colors.paper, 0.08),
    backgroundColor: colors.surface,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
  // Rest-Or-Plan-28C wireframe has no separate bar behind the button — it
  // sits directly on the gradient. Drops the dark `surface` fill/hairline
  // rather than keeping a dark bar over a now-light-purple screen.
  bottomBarRest: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
  },
});
