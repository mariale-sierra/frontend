import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '../ui/button';
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
        <Button variant="danger" size="sm" onPress={onRemove}>
          Remove
        </Button>
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
});