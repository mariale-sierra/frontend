import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ActivityIcon } from '../../../../components/icons/activityIcon';
import ScreenBackground from '../../../../components/layout/screenBackground';
import { Icon } from '../../../../components/ui/icon';
import { Text } from '../../../../components/ui/text';
import { colors, radius, spacing, type ActivityType } from '../../../../constants/theme';
import { toChallengeDetailViewModel } from '../../../../services/adapters';
import { getChallenge } from '../../../../services/challenge/challenge.service';
import type { ChallengeContract, ChallengeCycleDayContract, ChallengeExerciseContract } from '../../../../types/challenge';
import { useTranslation } from 'react-i18next';

interface MetricCell {
  value: string;
  unit: string;
}

interface ExerciseDetail {
  name: string;
  metrics: MetricCell[];
  activityType: ActivityType;
}

interface RoutineDetail {
  totalDays: number;
  day: number;
  routineName: string;
  categoryName: string;
  activityType: ActivityType;
  exercises: ExerciseDetail[];
}

const ACTIVITY_TYPES: ActivityType[] = [
  'strength',
  'cardioIntense',
  'cardioLow',
  'flexibility',
  'mindBody',
  'functional',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isActivityType(value: unknown): value is ActivityType {
  return typeof value === 'string' && ACTIVITY_TYPES.includes(value as ActivityType);
}

function buildDefaultMetrics(activityType: ActivityType): MetricCell[] {
  const defaultByType: Record<ActivityType, MetricCell[]> = {
    strength: [
      { value: '4', unit: 'sets' },
      { value: '8', unit: 'reps' },
      { value: '90', unit: 'sec' },
    ],
    cardioIntense: [
      { value: '6', unit: 'rounds' },
      { value: '30', unit: 'sec work' },
      { value: '20', unit: 'sec rest' },
    ],
    cardioLow: [
      { value: '30', unit: 'min' },
      { value: '120', unit: 'bpm' },
      { value: '1', unit: 'session' },
    ],
    flexibility: [
      { value: '3', unit: 'blocks' },
      { value: '60', unit: 'sec hold' },
      { value: '1', unit: 'flow' },
    ],
    mindBody: [
      { value: '20', unit: 'min' },
      { value: '1', unit: 'session' },
      { value: '4', unit: 'breath sets' },
    ],
    functional: [
      { value: '5', unit: 'rounds' },
      { value: '10', unit: 'reps' },
      { value: '60', unit: 'sec' },
    ],
  };

  return defaultByType[activityType];
}

function mapMetricsFromExercisePayload(
  rawMetrics: unknown,
  fallbackActivityType: ActivityType,
): MetricCell[] {
  if (!isRecord(rawMetrics)) {
    return buildDefaultMetrics(fallbackActivityType);
  }

  const kind = asString(rawMetrics.kind);

  if (kind === 'strength' && Array.isArray(rawMetrics.sets) && rawMetrics.sets.length > 0) {
    const firstSet = isRecord(rawMetrics.sets[0]) ? rawMetrics.sets[0] : null;
    const reps = firstSet ? asNumber(firstSet.reps) : null;
    const rest = firstSet ? asNumber(firstSet.rest_seconds) : null;

    return [
      { value: String(rawMetrics.sets.length), unit: 'sets' },
      { value: reps != null ? String(reps) : '-', unit: 'reps' },
      { value: rest != null ? String(rest) : '-', unit: 'sec' },
    ];
  }

  if (kind === 'schema' && isRecord(rawMetrics.values)) {
    const valueCount = Object.keys(rawMetrics.values).length;
    const templateId = asString(rawMetrics.template_id);

    return [
      { value: String(valueCount), unit: 'fields' },
      { value: templateId || '-', unit: 'template' },
    ];
  }

  return buildDefaultMetrics(fallbackActivityType);
}

function mapExercisesFromCycleDay(
  cycleDay: ChallengeCycleDayContract | undefined,
  fallbackActivityType: ActivityType,
): ExerciseDetail[] {
  if (!cycleDay || !Array.isArray(cycleDay.exercises) || cycleDay.exercises.length === 0) {
    return [];
  }

  return cycleDay.exercises.map((exercise: ChallengeExerciseContract, index) => {
    const activityType = isActivityType(exercise.activity_type)
      ? exercise.activity_type
      : fallbackActivityType;

    const name = asString(exercise.name) || `Exercise ${index + 1}`;
    const metrics = mapMetricsFromExercisePayload(exercise.metrics, activityType);

    return {
      name,
      metrics,
      activityType,
    };
  });
}

function buildFallbackExercises(activityType: ActivityType): ExerciseDetail[] {
  const namesByType: Record<ActivityType, string[]> = {
    strength: ['Back Squat', 'Romanian Deadlift', 'Walking Lunges'],
    cardioIntense: ['Sprint Intervals', 'Burpees', 'Row Sprints'],
    cardioLow: ['Brisk Walk', 'Cycling', 'Step-Ups'],
    flexibility: ['Hamstring Flow', 'Hip Openers', 'Thoracic Mobility'],
    mindBody: ['Breath Work', 'Mobility Flow', 'Core Control'],
    functional: ['Kettlebell Circuit', 'Loaded Carries', 'Box Step-Downs'],
  };

  return namesByType[activityType].map((name) => ({
    name,
    metrics: buildDefaultMetrics(activityType),
    activityType,
  }));
}

function ExerciseRow({ exercise, index }: { exercise: ExerciseDetail; index: number }) {
  return (
    <View>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseOrderBadge}>
          <Text variant="caption" style={styles.exerciseOrderText}>{index + 1}</Text>
        </View>
        <View style={styles.exerciseTitleWrap}>
          <View style={styles.exerciseTitleRow}>
            <Text variant="header" tone="primary" style={styles.exerciseName}>{exercise.name}</Text>
            <ActivityIcon type={exercise.activityType} size="md" variant="plain" />
          </View>
        </View>
      </View>
      <LinearGradient
        colors={[colors.surface, '#000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.metricsSurface}
      >
        <View style={styles.metricsRow}>
          {exercise.metrics.map((metric, metricIndex) => (
            <View key={`${exercise.name}-${metric.unit}-${metricIndex}`} style={styles.metricCell}>
              <Text variant="header" tone="primary" style={styles.metricValue}>{metric.value}</Text>
              <Text variant="caption" style={styles.metricUnit}>{metric.unit}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

export default function RoutineDayDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id, day } = useLocalSearchParams<{ id: string; day: string }>();
  const [challenge, setChallenge] = useState<ChallengeContract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadChallenge() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const data = await getChallenge(String(id));
        if (cancelled) return;
        setChallenge(data);
      } catch {
        if (cancelled) return;
        setChallenge(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadChallenge();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const challengeViewResult = challenge ? toChallengeDetailViewModel(challenge) : null;
  const challengeView = challengeViewResult?.ok ? challengeViewResult.value : null;

  const requestedDay = Number(day ?? 1);

  const routine = useMemo<RoutineDetail | null>(() => {
    if (!challengeView || challengeView.days.length === 0) {
      return null;
    }

    const selectedDay = challengeView.days.find((item) => item.day === requestedDay) ?? challengeView.days[0];
    const primaryActivity = selectedDay.activities[0] ?? challengeView.dominantActivity;

    const cycleDay = Array.isArray(challenge?.cycle_days)
      ? challenge.cycle_days.find((item) => asNumber(item.day_number) === selectedDay.day)
      : undefined;

    const backendExercises = mapExercisesFromCycleDay(cycleDay, primaryActivity);
    const exercises = backendExercises.length > 0
      ? backendExercises
      : buildFallbackExercises(primaryActivity);

    const categoryName =
      challengeView.activities.find((item) => item.activityType === primaryActivity)?.label ?? selectedDay.title;

    return {
      totalDays: challengeView.days.length,
      day: selectedDay.day,
      routineName: selectedDay.title,
      categoryName,
      activityType: primaryActivity,
      exercises,
    };
  }, [challenge, challengeView, requestedDay]);

  if (loading) {
    return (
      <ScreenBackground variant="default">
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      </ScreenBackground>
    );
  }

  if (!routine) {
    return (
      <ScreenBackground variant="default">
        <View style={styles.screen}>
          <View style={styles.headerTopRow}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Icon name="chevron-back" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
          <View style={styles.emptyStateWrap}>
            <Text variant="header" tone="primary" align="center">
              {t('challengeRoutineDay.emptyTitle')}
            </Text>
            <Text variant="body" tone="secondary" align="center" style={styles.emptyStateMessage}>
              {t('challengeRoutineDay.emptyMessage')}
            </Text>
          </View>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground variant="default">
      <View style={styles.screen}>
        <View style={styles.headerWrap}>
          <View style={styles.headerTopRow}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Icon name="chevron-back" size={20} color={colors.textPrimary} />
            </Pressable>

            <Text variant="caption" style={styles.dayOfLabel}>
              {t('challengeRoutineDay.dayOfLabel', {
                day: routine.day,
                total: routine.totalDays,
              })}
            </Text>

            <View style={styles.backButton} />
          </View>

          <View style={styles.routineRow}>
            <View style={styles.routineIdentityText}>
              <Text variant="caption" style={styles.routineEyebrow}>
                {t('challengeRoutineDay.routineLabel')}
              </Text>
              <Text variant="body" style={styles.routineTitle} numberOfLines={1}>
                {routine.routineName.toUpperCase()}
              </Text>
            </View>

            {/* Category is icon + name only now, never a color — see design
                system → Explicitly Rejected Patterns. Was a per-category
                accent wrap; flattened to a neutral `surface` fill. */}
            <View
              style={[
                styles.primaryIconWrap,
                {
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <ActivityIcon type={routine.activityType} size="lg" variant="circle" />
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {routine.exercises.map((exercise, index) => (
              <ExerciseRow key={`${exercise.name}-${index}`} exercise={exercise} index={index} />
            ))}
          </ScrollView>
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyStateMessage: {
    marginTop: spacing.xs,
  },
  headerWrap: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOfLabel: {
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  primaryIconWrap: {
    borderRadius: 24,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  routineIdentityText: {
    flex: 1,
  },
  routineEyebrow: {
    color: colors.textSecondary,
    letterSpacing: 1.2,
  },
  routineTitle: {
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: spacing.xxs,
    fontWeight: '500',
  },
  panel: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    paddingBottom: spacing['2xl'],
  },
  exerciseHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  exerciseOrderBadge: {
    width: 30,
    alignItems: 'center',
  },
  exerciseOrderText: {
    color: colors.textPrimary,
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '700',
  },
  exerciseTitleWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
  exerciseName: {
    flexShrink: 1,
  },
  metricsSurface: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
  },
  metricUnit: {
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.xxs,
  },
  pressed: {
    opacity: 0.88,
  },
});