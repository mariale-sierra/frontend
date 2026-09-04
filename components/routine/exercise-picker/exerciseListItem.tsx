import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { Icon } from '../../ui/icon';
import { colors, radius, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

interface ExerciseListItemProps {
  name: string;
  meta: string;
  selected: boolean;
  onPress: () => void;
  /** Thumbnail shown to the left of the row. Optional here only for this
   * component's original (routine-builder) callers, which never had images —
   * the exercise-catalog screen always passes one, since RepDB exercises
   * always have at least one asset. `radius.small`, per the design system's
   * "image/photo tiles always use this" rule. */
  imageUrl?: string | null;
  /** 'select' (default) — the routine-builder's original multi-select
   * behavior, a checkmark circle. 'navigate' — the exercise catalog's
   * tap-to-view-detail behavior, a chevron instead; `selected` is ignored. */
  mode?: 'select' | 'navigate';
}

/** Add-Exercises list row — List-row card (`surface` bg, `medium` radius),
 * a `primary` border + filled checkmark circle when selected. Same shell
 * shape as the routine-select screen's `RoutinePickerCard`. */
export function ExerciseListItem({ name, meta, selected, onPress, imageUrl, mode = 'select' }: ExerciseListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
    >
      {imageUrl !== undefined && (
        <View style={styles.thumbnail}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.thumbnailImage} resizeMode="cover" />
          ) : (
            <View style={styles.thumbnailPlaceholder} />
          )}
        </View>
      )}

      <View style={styles.textColumn}>
        <Text variant="body" weight="bold" numberOfLines={1}>{name}</Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>{meta}</Text>
      </View>

      {mode === 'navigate' ? (
        <Icon name="chevron-forward-outline" size={18} color={colors.neutral} />
      ) : (
        <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
          {selected && <Icon name="checkmark-outline" size={14} color={colors.ink} />}
        </View>
      )}
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
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: radius.small,
    overflow: 'hidden',
    backgroundColor: colors.ink,
    flexShrink: 0,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: withAlpha(colors.paper, 0.06),
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
