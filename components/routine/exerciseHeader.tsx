import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { Row } from '../layout/row';
import { ActivityIcon } from '../icons/activityIcon';
import { Icon } from '../ui/icon';
import { colors, spacing } from '../../constants/theme';
import type { ExerciseEntry } from '../../types/routine';

interface ExerciseHeaderProps {
  exercise: ExerciseEntry;
  index: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onRemove: () => void;
}

export function ExerciseHeader({
  exercise,
  index,
  collapsed,
  onToggleCollapsed,
  onRemove,
}: ExerciseHeaderProps) {
  function handleOpenOptions() {
    Alert.alert(
      'Exercise options',
      'Choose an action for this exercise.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Erase exercise', style: 'destructive', onPress: onRemove },
      ],
    );
  }

  return (
    <View style={styles.headerSection}>
      <Row justify="space-between" align="center">
        <Row align="center" gap="sm" style={styles.titleRow}>
          <Pressable onPress={onToggleCollapsed} hitSlop={10} style={styles.chevronButton}>
            <Icon
              name={collapsed ? 'chevron-forward' : 'chevron-down'}
              size={18}
              color={colors.textPrimary}
            />
          </Pressable>
          <ActivityIcon type={exercise.activityType} size="sm" variant="plain" />
          <Text variant="header" tone="primary" numberOfLines={1} style={styles.exerciseTitle}>
            {index + 1}. {exercise.name}
          </Text>
        </Row>
        <Pressable
          onPress={handleOpenOptions}
          hitSlop={10}
          style={({ pressed }) => [styles.optionsButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Exercise options"
        >
          <Icon name="ellipsis-horizontal" size={18} color={colors.textPrimary} />
        </Pressable>
      </Row>

      <Text variant="caption">{exercise.location}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  titleRow: {
    flex: 1,
    justifyContent: 'flex-start',
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  chevronButton: {
    padding: spacing.xxs,
  },
  exerciseTitle: {
    flex: 1,
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