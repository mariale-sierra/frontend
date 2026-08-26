import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreateFlowPrimaryButton } from '../../../components/challenge/create';
import ScreenBackground from '../../../components/layout/screenBackground';
import { Row } from '../../../components/layout/row';
import { Stack } from '../../../components/layout/stack';
import { BackButton } from '../../../components/ui/backButton';
import { Text } from '../../../components/ui/text';
import { RoutinePickerCard, RoutineModeToggle } from '../../../components/routine';
import { useRoutineBuilder } from '../../../store/routineBuilderStore';
import { colors, radius, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { useTranslation } from 'react-i18next';

export default function SelectRoutineScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { day } = useLocalSearchParams<{ day: string }>();
  const { init, savedRoutines, assignRoutineToDay, assignRestDayToDay } = useRoutineBuilder();
  const [mode, setMode] = useState<'workout' | 'rest'>('workout');

  const dayNumber = Number(day ?? '1');
  const workoutRoutines = useMemo(
    () => savedRoutines.filter((routine) => !routine.isRestDay),
    [savedRoutines],
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

  return (
    <ScreenBackground variant="top">
      <Row justify="space-between" align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} onPress={() => router.back()} />
        <Text variant="title" align="center" style={styles.headerTitle}>
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
            <View style={styles.restModeContent}>
              <Image
                source={require('../../../assets/images/RestDay.png')}
                style={styles.restIllustration}
                resizeMode="contain"
              />
              <Stack gap="xs" align="center">
                <Text variant="body" weight="bold" size="xl" style={styles.restModeTitle}>
                  {t('routineSelect.restDay.title')}
                </Text>
                <Text variant="body" tone="primary" size="sm" align="center" style={styles.restModeSubtitle}>
                  {t('routineSelect.restDay.description')}
                </Text>
              </Stack>
            </View>
          )}
        </Stack>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <CreateFlowPrimaryButton
          tone={mode === 'workout' ? 'primary' : 'rest'}
          onPress={mode === 'workout' ? handleConfirmWorkout : handleConfirmRestDay}
          disabled={mode === 'workout' && !selectedRoutineId}
          label={mode === 'workout' ? t('routineSelect.confirmRoutine') : t('routineSelect.confirmRestDay')}
        />
      </View>
    </ScreenBackground>
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
    gap: spacing.lg,
    paddingVertical: spacing['2xl'],
  },
  restIllustration: {
    width: 200,
    height: 200,
  },
  restModeTitle: {
    color: colors.rest,
    opacity: 1,
  },
  restModeSubtitle: {
    maxWidth: 240,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
});
