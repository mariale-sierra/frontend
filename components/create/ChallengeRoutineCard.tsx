import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../ui/text';
import { ActivityIcon } from '../icons/activityIcon';
import { getRoutineLocationSummary, type RoutineSummary } from '../../store/routineBuilderStore';
import { colors, gradients, radius, spacing } from '../../constants/theme';

interface ChallengeRoutineCardProps {
  routine: RoutineSummary;
  onPress: () => void;
}

export function ChallengeRoutineCard({ routine, onPress }: ChallengeRoutineCardProps) {
  const gradientColors = routine.isRestDay
    ? (['#485365', '#0e1a34'] as const)
    : gradients.surfaceVertical.colors;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text variant="subheader" numberOfLines={1} style={styles.title}>
          {routine.name}
        </Text>

        <Text variant="caption" numberOfLines={2} style={styles.description}>
          {routine.isRestDay
            ? 'Recovery, mobility, or complete rest.'
            : `${getRoutineLocationSummary(routine.exercises)} · ${routine.exercises.length} exercises`}
        </Text>

        {!routine.isRestDay && routine.activityTypes.length > 0 && (
          <View style={styles.iconRow}>
            {routine.activityTypes.slice(0, 4).map((activityType) => (
              <ActivityIcon key={activityType} type={activityType} size="xs" variant="circle" />
            ))}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    minHeight: 94,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  title: {
    maxWidth: '82%',
  },
  description: {
    color: 'rgba(255,255,255,0.78)',
    marginTop: spacing.xs,
  },
  iconRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
  pressed: {
    opacity: 0.84,
  },
});