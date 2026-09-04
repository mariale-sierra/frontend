import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '../../../utils/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateFlowPrimaryButton } from '../../../components/challenge/create';
import ScreenBackground from '../../../components/layout/screenBackground';
import { Row } from '../../../components/layout/row';
import { Stack } from '../../../components/layout/stack';
import { Text } from '../../../components/ui/text';
import { Icon } from '../../../components/ui/icon';
import { Input } from '../../../components/ui/input';
import { ExerciseBlock } from '../../../components/routine';
import { useRoutineBuilder } from '../../../store/routineBuilderStore';
import { colors, radius, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { addExerciseToRoutine, buildRoutineExercisePersistence, createRoutine } from '../../../services/routine/routine.service';
import { getMetricTypes } from '../../../services/metrics/metrics.service';
import { createRoutineNameSchema, type RoutineNameFormValues } from '../../../validation/routineSchemas';

const ROUTINE_NAME_MAX = 40;

export default function CreateRoutineScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
  const hasExercises = exercises.length > 0;
  const canSave = routineName.trim().length > 0;

  // routineName itself lives in routineBuilderStore (shared across this
  // multi-step flow) — this form only owns the zod validation + inline
  // error, synced to the store on every change (same pattern as the
  // Challenge Create Name step, see useCreateChallengeFlow.ts).
  const nameSchema = useMemo(() => createRoutineNameSchema(t), [t]);
  const {
    setValue: setNameFormValue,
    trigger: triggerNameValidation,
    formState: { errors: nameErrors },
  } = useForm<RoutineNameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { routineName },
  });

  function handleChangeName(value: string) {
    setRoutineName(value);
    setNameFormValue('routineName', value, { shouldValidate: Boolean(nameErrors.routineName) });
  }

  async function requireName(): Promise<boolean> {
    return triggerNameValidation('routineName');
  }

  async function handleAddExercises() {
    if (!(await requireName())) return;
    router.push(`/challenge/routine/exercises?day=${dayNumber}`);
  }

  async function handleSubmit() {
    if (isSubmitting) return;

    // Rest days are client-only — no exercises to persist.
    if (isRestDay) {
      saveCurrentRoutineToDay();
      router.replace('/challenge/create');
      return;
    }

    if (!(await requireName())) return;

    setIsSubmitting(true);
    try {
      const routine = await createRoutine({
        name: routineName.trim(),
        description: routineDescription.trim() || undefined,
        is_active: true,
      });

      // Resolves a schema exercise's field keys ('distance'/'time') to the
      // numeric metric_type_id POST /routine/:id/exercises's targets[] wants
      // — one fetch for the whole routine, not per exercise.
      const metricTypes = await getMetricTypes();
      const metricCodeToId = Object.fromEntries(metricTypes.map((m) => [m.code, m.id]));

      for (const exercise of exercises) {
        const backendId = backendExerciseIdByLocalId[exercise.id];
        if (backendId == null) {
          console.warn(`[CreateRoutine] Skipping "${exercise.name}" — no backend exerciseId`);
          continue;
        }
        const persistence = buildRoutineExercisePersistence(exercise.metrics, metricCodeToId);
        await addExerciseToRoutine(routine.id, backendId, persistence);
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
      <Row justify="space-between" align="center" style={styles.topBar}>
        <Pressable onPress={() => safeBack()} hitSlop={12} style={styles.iconButton}>
          <Icon
            name={hasExercises ? 'chevron-back-outline' : 'close-outline'}
            size={24}
            color={colors.paper}
          />
        </Pressable>

        <Text
          variant="label"
          weight="bold"
          onPress={canSave ? handleSubmit : undefined}
          style={canSave ? styles.saveActive : styles.saveDisabled}
        >
          {t('routineCreate.save')}
        </Text>
      </Row>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Stack gap="lg">
          <Stack gap="sm">
            <Text variant="title" numberOfLines={2}>
              {hasExercises ? routineName : t('routineCreate.nameStep.title')}
            </Text>
            <Text variant="body" size="sm" tone="secondary">
              {hasExercises
                ? t('routineCreate.exercisesAddedCount', { count: exercises.length })
                : t('routineCreate.nameStep.description')}
            </Text>
          </Stack>

          {!hasExercises ? (
            <Stack gap="lg">
              <Stack gap="sm">
                <Row justify="space-between" align="center">
                  <Text variant="header" tone="secondary" size="xs">{t('routineCreate.fields.routineName')}</Text>
                  <Text variant="caption" tone="secondary">{routineName.length} / {ROUTINE_NAME_MAX}</Text>
                </Row>
                <Input
                  variant="filled"
                  value={routineName}
                  onChangeText={handleChangeName}
                  onBlur={() => triggerNameValidation('routineName')}
                  error={Boolean(nameErrors.routineName)}
                  maxLength={ROUTINE_NAME_MAX}
                  showCounter={false}
                  placeholder={t('routineCreate.routineNamePlaceholder')}
                  placeholderVariant="secondary"
                />
                {nameErrors.routineName ? (
                  <Text variant="caption" style={styles.errorText}>
                    {nameErrors.routineName.message}
                  </Text>
                ) : null}
              </Stack>

              <Stack gap="sm">
                <Row justify="space-between" align="center">
                  <Text variant="header" tone="secondary" size="xs">{t('routineCreate.fields.description')}</Text>
                  <Text variant="caption" tone="secondary">{t('routineCreate.fields.optional')}</Text>
                </Row>
                <Input
                  variant="filled"
                  value={routineDescription}
                  onChangeText={setRoutineDescription}
                  multiline
                  placeholder={t('routineCreate.routineDescriptionPlaceholder')}
                  placeholderVariant="secondary"
                  containerStyle={styles.descriptionInput}
                />
              </Stack>
            </Stack>
          ) : (
            <Stack gap="base">
              {exercises.map((exercise, index) => (
                <ExerciseBlock key={exercise.id} exercise={exercise} index={index} />
              ))}

              <Pressable
                onPress={handleAddExercises}
                style={({ pressed }) => [styles.addMoreRow, pressed && styles.pressed]}
              >
                <Icon name="add-outline" size={16} color={colors.primary} />
                <Text variant="label" weight="bold" style={styles.addMoreLabel}>
                  {t('routineCreate.addExercisesCta')}
                </Text>
              </Pressable>
            </Stack>
          )}
        </Stack>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <CreateFlowPrimaryButton
          onPress={hasExercises ? handleSubmit : handleAddExercises}
          loading={isSubmitting}
          label={hasExercises ? t('routineCreate.setAsDayRoutineCta', { day: dayNumber }) : t('routineCreate.addExercisesCta')}
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  iconButton: {
    width: 44,
    height: 44,
    marginLeft: -spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveActive: {
    color: colors.primary,
    opacity: 1,
  },
  saveDisabled: {
    opacity: 1,
    color: withAlpha(colors.paper, textOpacity.tertiary),
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'] + 132,
    flexGrow: 1,
  },
  descriptionInput: {
    minHeight: 96,
    alignItems: 'flex-start',
  },
  errorText: {
    color: colors.error,
  },
  addMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.medium,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: withAlpha(colors.paper, textOpacity.tertiary),
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  addMoreLabel: {
    color: colors.primary,
    opacity: 1,
  },
  pressed: {
    opacity: 0.82,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
});
