import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { Icon } from '../../ui/icon';
import { colors, radius, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

// Bigger than the previous 44 — the row no longer has its own card padding
// around it (see below), so the freed horizontal space goes to the image
// instead. Radius stays `small` regardless of size, per the standing
// "photo tiles ALWAYS radius.small" rule (same precedent as
// ChallengeQuickPickRow's own THUMB_SIZE bump).
const THUMB_SIZE = 64;

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

/** Add-Exercises list row — a continuous divided list, not an independent
 * card: no background/border/radius of its own, rows are separated purely
 * by the parent list's own hairline `ItemSeparatorComponent`. Selection is
 * conveyed by the trailing filled checkmark circle alone (no more selected
 * border, since a bordered "card" doesn't fit this shell shape). */
export function ExerciseListItem({ name, meta, selected, onPress, imageUrl, mode = 'select' }: ExerciseListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.sm,
  },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
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
