import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreateChallengePrimaryActionButton, CreateFlowFixedBottomBar } from '../../../components/create';
import ScreenBackground from '../../../components/layout/screenBackground';
import { Stack } from '../../../components/layout/stack';
import { Text } from '../../../components/ui/text';
import { Icon } from '../../../components/ui/icon';
import { CreateRoutinePickerCard, DayRoutineHeader, RoutineModeToggle, RoutinePickerCard } from '../../../components/routine';
import { useRoutineBuilder } from '../../../store/routineBuilderStore';
import { colors, spacing } from '../../../constants/theme';
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
      <DayRoutineHeader
        title={t('routineSelect.dayRoutineTitle', { day: dayNumber })}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Stack gap="md">
          <RoutineModeToggle value={mode} onChange={setMode} />

          {mode === 'workout' ? (
            <>
              <View style={styles.createCardWrap}>
                <CreateRoutinePickerCard onPress={handleCreateNew} />
              </View>

              {workoutRoutines.map((routine) => (
                <RoutinePickerCard
                  key={routine.id}
                  routine={routine}
                  selected={selectedRoutineId === routine.id}
                  onSelect={() => setSelectedRoutineId(routine.id)}
                  onOpen={() => handleViewRoutine(routine.id)}
                />
              ))}

              {workoutRoutines.length === 0 && (
                <View style={styles.emptyState}>
                  <Text variant="body" tone="secondary">Create a routine to continue.</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.restModeContent}>
              <Icon name="moon" size={72} color={colors.textPrimary} />
              <Text variant="subheader" style={styles.restModeTitle}>Rest day</Text>
              <Text variant="body" tone="secondary" style={styles.restModeSubtitle}>
                Recovery, mobility, or total reset.
              </Text>
            </View>
          )}
        </Stack>
      </ScrollView>

      <CreateFlowFixedBottomBar bottomInset={Math.max(insets.bottom, spacing.lg)}>
        <CreateChallengePrimaryActionButton
          onPress={mode === 'workout' ? handleConfirmWorkout : handleConfirmRestDay}
          disabled={mode === 'workout' && !selectedRoutineId}
          label={mode === 'workout' ? 'Confirm routine' : 'Confirm rest day'}
        />
      </CreateFlowFixedBottomBar>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'] + 132,
    flexGrow: 1,
  },
  pressed: {
    opacity: 0.82,
  },
  createCardWrap: {
    marginTop: spacing.md,
  },
  emptyState: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restModeContent: {
    minHeight: 340,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing['2xl'],
  },
  restModeTitle: {
    fontSize: 16,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  restModeSubtitle: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 240,
  },
});
