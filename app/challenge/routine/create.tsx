import { useState } from 'react';
import { ScrollView, StyleSheet, Pressable, View, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ScreenBackground from '../../../components/layout/screenBackground';
import { Stack } from '../../../components/layout/stack';
import { Row } from '../../../components/layout/row';
import { Text } from '../../../components/ui/text';
import { Icon } from '../../../components/ui/icon';
import { ExerciseBlock } from '../../../components/routine/exerciseBlock';
import { getRoutineLocationSummary, useRoutineBuilder } from '../../../store/routineBuilderStore';
import { colors, spacing, radius, typography } from '../../../constants/theme';
import { addExerciseToRoutine, createRoutine } from '../../../services/routine/routine.service';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function CreateRoutineScreen() {
  const { t } = useTranslation();
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
    resetBuilder,
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

  function handleDiscard() {
    resetBuilder();
    router.back();
  }

  return (
    <ScreenBackground variant="top">
      {/* Header */}
      <Row align="center" gap="md" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="subheader">{t('routineCreate.dayRoutineTitle', { day: dayNumber })}</Text>
      </Row>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Stack gap="lg">
          <View style={styles.inputGroup}>
            <TextInput
              value={routineName}
              onChangeText={setRoutineName}
              placeholder={t('routineCreate.routineNamePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={styles.nameInput}
            />
            <View style={styles.inputDivider} />
          </View>

          <View style={styles.descriptionWrap}>
            <TextInput
              value={routineDescription}
              onChangeText={setRoutineDescription}
              placeholder={isRestDay ? t('routineCreate.recoveryDetailsPlaceholder') : t('routineCreate.routineDescriptionPlaceholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              style={styles.descriptionInput}
            />
          </View>

          {!isRestDay && exercises.length > 0 && (
            <Text variant="caption" numberOfLines={1} ellipsizeMode="tail" style={styles.routineMeta}>
              {`${getRoutineLocationSummary(exercises)} · ${exercises.length} exercises`}
            </Text>
          )}

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

          {isRestDay && (
            <View style={styles.restStateCard}>
              <Text variant="subheader">{t('routineCreate.restDayTitle')}</Text>
              <Text variant="body" tone="secondary">
                {t('routineCreate.restDayDescription')}
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            {/* Add Exercise — full width, pill shaped, outline */}
            {!isRestDay && (
              <Pressable
                onPress={handleAddExercise}
                style={({ pressed }) => [styles.addExerciseBtn, pressed && styles.pressed]}
              >
                <Icon name="add" size={18} color={colors.textPrimary} />
                <Text variant="label" style={styles.addExerciseBtnText}>{t('routineCreate.addExercise')}</Text>
              </Pressable>
            )}

            {/* Select / Save — full width, primary */}
            <Pressable
              onPress={handleSelectRoutine}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.selectBtn,
                pressed && styles.pressed,
                isSubmitting && styles.disabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text variant="label" style={styles.selectBtnText}>{t('routineCreate.selectRoutine')}</Text>
              )}
            </Pressable>

            {/* Discard — small, centered, danger */}
            <Pressable onPress={handleDiscard} hitSlop={8} style={styles.discardBtn} disabled={isSubmitting}>
              <Text variant="caption" style={styles.discardBtnText}>{t('routineCreate.discard')}</Text>
            </Pressable>
          </View>
        </Stack>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    justifyContent: 'flex-start',
  },
  backBtn: {
    padding: spacing.xs,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  actions: {
    gap: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  nameInput: {
    ...typography.header,
    fontSize: 12,
    lineHeight: 20,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  inputDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  descriptionWrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.md,
  },
  descriptionInput: {
    minHeight: 84,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  routineMeta: {
    color: colors.textSecondary,
  },
  exerciseList: {
    marginHorizontal: -spacing.lg,
    gap: spacing.xl,
  },
  restStateCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(46,124,246,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(46,124,246,0.4)',
  },
  // Add exercise — long pill outline
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    paddingVertical: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    backgroundColor: colors.background,
  },
  addExerciseBtnText: {
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  // Select — long primary
  selectBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
  },
  selectBtnText: {
    color: colors.textInverse,
    letterSpacing: 2,
  },
  // Discard — small, centered
  discardBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  discardBtnText: {
    color: colors.error,
    textDecorationLine: 'underline',
    letterSpacing: 0.5,
  },
});
