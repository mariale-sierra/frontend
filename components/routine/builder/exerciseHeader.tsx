import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { Row } from '../../layout/row';
import { Icon } from '../../ui/icon';
import { colors, radius, spacing, textOpacity, activityColors } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { useRoutineBuilder, getTotalRestSeconds } from '../../../store/routineBuilderStore';
import type { ExerciseEntry } from '../../../types/routine';

interface ExerciseHeaderProps {
  exercise: ExerciseEntry;
  index: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onRemoveExerciseId: string;
}

function getMetaSummary(exercise: ExerciseEntry, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (exercise.metrics.kind === 'strength') {
    const firstSet = exercise.metrics.sets[0];
    return t('routineCreate.stepper.metaSummary', {
      sets: exercise.metrics.sets.length,
      reps: firstSet?.reps ?? 0,
      rest: firstSet ? getTotalRestSeconds(firstSet) : 0,
    });
  }

  const numberField = exercise.metrics.template.fields.find((field) => field.type === 'number');
  if (numberField) {
    const value = exercise.metrics.values[numberField.key];
    const numericValue = typeof value === 'number' ? value : numberField.defaultValue;
    const valueLabel = numberField.unit ? `${numericValue} ${numberField.unit}` : String(numericValue);
    return t('routineCreate.stepper.schemaMetaSummary', { value: valueLabel });
  }

  return t('routineCreate.stepper.schemaMetaSummaryFallback');
}

export function ExerciseHeader({
  exercise,
  index,
  collapsed,
  onToggleCollapsed,
  onRemoveExerciseId,
}: ExerciseHeaderProps) {
  const { t } = useTranslation();
  const { removeExercise } = useRoutineBuilder();

  function handleOpenOptions() {
    Alert.alert(
      t('routineCreate.exerciseOptions.title'),
      t('routineCreate.exerciseOptions.message'),
      [
        { text: t('routineCreate.exerciseOptions.cancel'), style: 'cancel' },
        { text: t('routineCreate.exerciseOptions.erase'), style: 'destructive', onPress: () => removeExercise(onRemoveExerciseId) },
      ],
    );
  }

  return (
    <Pressable onPress={collapsed ? onToggleCollapsed : undefined} style={styles.headerSection}>
      <Row justify="space-between" align="center" gap="md">
        <View style={[styles.badge, { backgroundColor: activityColors[exercise.activityType] }]}>
          <Text variant="caption" weight="bold" style={styles.badgeNumber}>{index + 1}</Text>
        </View>

        {exercise.imageUrl ? (
          <View style={styles.thumbnail}>
            <Image source={{ uri: exercise.imageUrl }} style={styles.thumbnailImage} resizeMode="cover" />
          </View>
        ) : null}

        <View style={styles.textColumn}>
          <Text variant="body" weight="bold" numberOfLines={1}>{exercise.name}</Text>
          <Text variant="caption" weight="medium" tone="primary" numberOfLines={1}>
            {getMetaSummary(exercise, t)}
          </Text>
        </View>

        {collapsed ? (
          <Icon name="chevron-forward-outline" size={18} color={withAlpha(colors.paper, textOpacity.secondary)} />
        ) : (
          <Row align="center" gap="xs">
            <Pressable
              onPress={handleOpenOptions}
              hitSlop={10}
              style={({ pressed }) => [styles.optionsButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('routineCreate.exerciseOptions.optionsA11y')}
            >
              <Icon name="ellipsis-horizontal-outline" size={18} color={colors.paper} />
            </Pressable>

            <Pressable
              onPress={onToggleCollapsed}
              hitSlop={10}
              style={({ pressed }) => [styles.optionsButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('routineCreate.exerciseOptions.collapseA11y')}
            >
              <Icon name="chevron-up-outline" size={18} color={colors.paper} />
            </Pressable>
          </Row>
        )}
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: radius.big,
    // backgroundColor set inline — this exercise's own activity category color.
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeNumber: {
    color: colors.ink,
    opacity: 1,
  },
  thumbnail: {
    width: 36,
    height: 36,
    borderRadius: radius.small,
    overflow: 'hidden',
    backgroundColor: colors.ink,
    flexShrink: 0,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  optionsButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
