import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface MuscleListItemProps {
  name: string;
  imageUrl: string | null;
  onPress: () => void;
  /** Shows a trailing checkmark, same treatment as `FilterSheet`'s own rows —
   * used where this row doubles as a filter option (the Muscles filter
   * sheet), not needed for a plain navigation list. */
  selected?: boolean;
}

/** Muscle browser / muscle-filter row — image ALWAYS present (requirement,
 * not optional): RepDB's own icon when available, else a neutral tinted
 * placeholder (only 2 of 29 muscles lack a RepDB icon — never a hard-coded
 * generic silhouette pretending to BE the muscle; the real anatomical
 * fallback lives in the SVG panel via `muscle_svg_parts.is_fallback`, this
 * is just the small list thumbnail). Same shell shape as `ExerciseListItem`. */
export function MuscleListItem({ name, imageUrl, onPress, selected = false }: MuscleListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.thumbnail}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.thumbnailImage} resizeMode="contain" />
        ) : (
          <View style={styles.thumbnailPlaceholder} />
        )}
      </View>
      <Text variant="body" weight="bold" numberOfLines={1} style={styles.name}>
        {name}
      </Text>
      {selected && <Icon name="checkmark-outline" size={18} color={colors.primary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.9,
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
  name: {
    flex: 1,
  },
});
