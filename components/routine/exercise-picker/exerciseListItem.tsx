import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { Icon } from '../../ui/icon';
import { colors, radius, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

interface ExerciseListItemProps {
  name: string;
  meta: string;
  selected: boolean;
  onPress: () => void;
}

/** Add-Exercises list row — List-row card (`surface` bg, `medium` radius),
 * a `primary` border + filled checkmark circle when selected. Same shell
 * shape as the routine-select screen's `RoutinePickerCard`. */
export function ExerciseListItem({ name, meta, selected, onPress }: ExerciseListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
    >
      <View style={styles.textColumn}>
        <Text variant="body" weight="bold" numberOfLines={1}>{name}</Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>{meta}</Text>
      </View>

      <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
        {selected && <Icon name="checkmark-outline" size={14} color={colors.ink} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.medium,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: radius.big,
    borderWidth: 1.5,
    borderColor: withAlpha(colors.paper, textOpacity.tertiary),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkCircleSelected: {
    borderWidth: 0,
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.9,
  },
});
