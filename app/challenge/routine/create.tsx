import { useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChallengeTitleInputs, CreateChallengePrimaryActionButton, CreateFlowFixedBottomBar } from '../../../components/create';
import ScreenBackground from '../../../components/layout/screenBackground';
import { Stack } from '../../../components/layout/stack';
import { CreateRoutinePickerCard, DayRoutineHeader, ExerciseBlock } from '../../../components/routine';
import { useRoutineBuilder } from '../../../store/routineBuilderStore';
import { spacing } from '../../../constants/theme';
import { addExerciseToRoutine, createRoutine } from '../../../services/routine/routine.service';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function CreateRoutineScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { day } = useLocalSearchParams<{ day: string }>();
  const {
    routineName,
    routineDescription,
    isRestDay,
    exercises,
    backendExerciseIdByLocalId,
    setRoutineName,
    setRoutineDescription,
    saveCurrentRoutineToDay,
    stampBackendIdOnDay,
  } = useRoutineBuilder();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const dayNumber = Number(day ?? '1');

  function handleAddExercise() {
    router.push(`/challenge/routine/exercises?day=${dayNumber}`);
  }

  async function handleSelectRoutine() {
    if (isSubmitting) return;

    // Rest days are client-only — no exercises to persist.
    if (isRestDay) {
      saveCurrentRoutineToDay();
      router.replace('/challenge/create');
      return;
    }

    if (routineName.trim().length === 0) {
      Alert.alert(t('routineCreate.alerts.nameRequiredTitle'), t('routineCreate.alerts.nameRequiredMessage'));
      return;
    }

    setIsSubmitting(true);
    try {
      const routine = await createRoutine({
        name: routineName.trim(),
        description: routineDescription.trim() || undefined,
        createdByUserId: userId ?? undefined,
        is_active: true,
      });

      for (const exercise of exercises) {
        const backendId = backendExerciseIdByLocalId[exercise.id];
        if (backendId == null) {
          console.warn(`[CreateRoutine] Skipping "${exercise.name}" — no backend exerciseId`);
          continue;
        }
        await addExerciseToRoutine(routine.id, backendId);
      }

      saveCurrentRoutineToDay();
      stampBackendIdOnDay(dayNumber, routine.id);
      router.replace('/challenge/create');
    } catch (error: any) {
      console.error('[CreateRoutine] Failed:', error?.response?.data ?? error?.message);
      Alert.alert(
        t('routineCreate.alerts.saveFailedTitle'),
        error?.response?.data?.message ?? t('routineCreate.alerts.saveFailedFallback'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenBackground variant="top">
      <DayRoutineHeader
        title={t('routineCreate.dayRoutineTitle', { day: dayNumber })}
        onBack={() => router.back()}
        rightActionLabel={t('routineCreate.save')}
        onRightActionPress={handleSelectRoutine}
        rightActionDisabled={isSubmitting}
        rightActionLoading={isSubmitting}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Stack gap="lg">
          <ChallengeTitleInputs
            title={routineName}
            description={routineDescription}
            onChangeTitle={setRoutineName}
            onChangeDescription={setRoutineDescription}
            showDescriptionBottomLine={false}
            titlePlaceholder={t('routineCreate.routineNamePlaceholder')}
            descriptionPlaceholder={
              isRestDay ? t('routineCreate.recoveryDetailsPlaceholder') : t('routineCreate.routineDescriptionPlaceholder')
            }
          />

          {!isRestDay && exercises.length > 0 && (
            <View style={styles.exerciseList}>
              {exercises.map((exercise, index) => (
                <ExerciseBlock
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                />
              ))}
            </View>
          )}

          <View style={styles.actions}>
            {!isRestDay && (
              <CreateRoutinePickerCard onPress={handleAddExercise} label={t('routineCreate.addExercise')} />
            )}
          </View>
        </Stack>
      </ScrollView>

      <CreateFlowFixedBottomBar bottomInset={Math.max(insets.bottom, spacing.lg)}>
        <CreateChallengePrimaryActionButton
          onPress={handleSelectRoutine}
          loading={isSubmitting}
          label={t('routineCreate.selectRoutine')}
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
  actions: {
    gap: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  exerciseList: {
    marginTop: spacing.xs,
    marginHorizontal: -spacing.lg,
    gap: spacing.md,
  },
});
