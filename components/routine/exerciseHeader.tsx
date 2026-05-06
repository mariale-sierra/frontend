import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { Row } from '../layout/row';
import { ActivityIcon } from '../icons/activityIcon';
import { Icon } from '../ui/icon';
import { ExerciseSetCounter } from './exerciseSetCounter';
import { colors, spacing } from '../../constants/theme';
import { useRoutineBuilder } from '../../store/routineBuilderStore';
import type { ExerciseEntry } from '../../types/routine';

interface ExerciseHeaderProps {
  exercise: ExerciseEntry;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onRemoveExerciseId: string;
}

export function ExerciseHeader({
  exercise,
  collapsed,
  onToggleCollapsed,
  onRemoveExerciseId,
}: ExerciseHeaderProps) {
  const { removeExercise, addStrengthSet, removeStrengthSet } = useRoutineBuilder();

  const strengthSetCount = exercise.metrics.kind === 'strength' ? exercise.metrics.sets.length : null;

  function handleOpenOptions() {
    Alert.alert(
      'Exercise options',
      'Choose an action for this exercise.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Erase exercise', style: 'destructive', onPress: () => removeExercise(onRemoveExerciseId) },
      ],
    );
  }

  return (
    <Pressable onPress={collapsed ? onToggleCollapsed : undefined} style={styles.headerSection}>
      <Row justify="space-between" align="center" style={styles.mainRow}>
        <Row align="center" gap="sm" style={styles.leadingRow}>
          <ActivityIcon type={exercise.activityType} size="md" variant="plain" />

          <View style={styles.textColumn}>
            <Text variant="header" tone="primary" numberOfLines={1} style={styles.exerciseTitle}>
              {exercise.name}
            </Text>

            <Text variant="caption" numberOfLines={1} style={styles.exerciseSubtitle}>
              {exercise.location}
            </Text>
          </View>
        </Row>

        {!collapsed && strengthSetCount != null ? (
          <ExerciseSetCounter
            count={strengthSetCount}
            onIncrease={() => addStrengthSet(exercise.id)}
            onDecrease={() => removeStrengthSet(exercise.id, strengthSetCount - 1)}
          />
        ) : null}

        {collapsed ? (
          <Icon name="chevron-down" size={18} color="rgba(255,255,255,0.42)" />
        ) : (
          <Row align="center" gap="xs">
            <Pressable
              onPress={handleOpenOptions}
              hitSlop={10}
              style={({ pressed }) => [styles.optionsButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Exercise options"
            >
              <Icon name="ellipsis-horizontal" size={18} color={colors.textPrimary} />
            </Pressable>

            <Pressable
              onPress={onToggleCollapsed}
              hitSlop={10}
              style={({ pressed }) => [styles.optionsButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Collapse exercise"
            >
              <Icon name="chevron-up" size={18} color="rgba(255,255,255,0.52)" />
            </Pressable>
          </Row>
        )}
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  mainRow: {
    width: '100%',
    gap: spacing.sm,
  },
  leadingRow: {
    flex: 1,
    minHeight: 40,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  exerciseTitle: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 20,
  },
  exerciseSubtitle: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 10,
    lineHeight: 14,
  },
  optionsButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});