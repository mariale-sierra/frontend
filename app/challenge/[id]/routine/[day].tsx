import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ActivityIcon } from '../../../../components/icons/activityIcon';
import ScreenBackground from '../../../../components/layout/screenBackground';
import { Divider } from '../../../../components/ui/divider';
import { Icon } from '../../../../components/ui/icon';
import { Text } from '../../../../components/ui/text';
import { colors, gradients, radius, spacing, type ActivityType } from '../../../../constants/theme';

interface MetricCell {
  value: string;
  unit: string;
}

interface ExerciseDetail {
  name: string;
  metrics: MetricCell[];
}

interface RoutineDetail {
  totalDays: number;
  day: number;
  routineName: string;
  categoryName: string;
  activityType: ActivityType;
  exercises: ExerciseDetail[];
}

function buildMockRoutine(day: number): RoutineDetail {
  return {
    totalDays: 4,
    day,
    routineName: 'Lower Body Power',
    categoryName: 'Strength training',
    activityType: 'strength',
    exercises: [
      {
        name: 'Back Squat',
        metrics: [
          { value: '4', unit: 'sets' },
          { value: '8', unit: 'reps' },
          { value: '90', unit: 'sec' },
        ],
      },
      {
        name: 'Romanian Deadlift',
        metrics: [
          { value: '3', unit: 'sets' },
          { value: '10', unit: 'reps' },
          { value: '75', unit: 'sec' },
        ],
      },
      {
        name: 'Walking Lunges',
        metrics: [
          { value: '3', unit: 'sets' },
          { value: '12', unit: 'reps' },
          { value: '60', unit: 'sec' },
        ],
      },
    ],
  };
}

export default function RoutineDayDetail() {
  const router = useRouter();
  const { day } = useLocalSearchParams<{ day: string }>();

  const dayNumber = Number(day ?? 1);
  const routine = useMemo(() => buildMockRoutine(Number.isFinite(dayNumber) ? dayNumber : 1), [dayNumber]);

  return (
    <ScreenBackground variant="default">
      <View style={styles.screen}>
        <View style={styles.headerWrap}>
          <View style={styles.headerTopRow}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Icon name="chevron-back" size={20} color={colors.textPrimary} />
            </Pressable>

            <Text variant="caption" style={styles.dayOfLabel}>DAY {routine.day} OF {routine.totalDays}</Text>

            <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <Icon name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.routineRow}>
            <ActivityIcon type={routine.activityType} size="md" variant="plain" />

            <View style={styles.routineIdentityText}>
              <Text variant="caption" style={styles.routineEyebrow}>ROUTINE</Text>
              <Text variant="body" style={styles.routineTitle} numberOfLines={1}>
                {routine.routineName.toUpperCase()}
              </Text>
              <Text variant="caption" style={styles.routineSubtitle}>{routine.categoryName}</Text>
            </View>

            <View style={styles.exerciseCountChip}>
              <Text variant="caption" style={styles.exerciseCountText}>{routine.exercises.length} EX</Text>
            </View>
          </View>
        </View>

        <Divider variant="section" />

        <View style={styles.panel}>
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {routine.exercises.map((exercise, index) => (
              <View key={`${exercise.name}-${index}`} style={styles.exerciseBlock}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseOrderBadge}>
                    <Text variant="caption" style={styles.exerciseOrderText}>{index + 1}</Text>
                  </View>

                  <View style={styles.exerciseTitleWrap}>
                    <View style={styles.exerciseTitleRow}>
                      <Text variant="header" tone="primary" style={styles.exerciseName}>{exercise.name}</Text>
                      <ActivityIcon type={routine.activityType} size="md" variant="plain" />
                    </View>
                  </View>
                </View>

                <LinearGradient
                  colors={gradients.surface.colors}
                  start={gradients.surface.start}
                  end={gradients.surface.end}
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
  actionButton: {
    minWidth: 38,
    minHeight: 38,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
    gap: spacing.md,
    marginTop: spacing.xs,
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
  routineSubtitle: {
    marginTop: 2,
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  exerciseCountChip: {
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseCountText: {
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  panel: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    paddingBottom: spacing['2xl'],
  },
  exerciseBlock: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    borderWidth: 1,
    borderColor: colors.border,
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
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHighlight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
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
