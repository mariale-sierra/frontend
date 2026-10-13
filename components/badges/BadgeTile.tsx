import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fillOpacity, radius, spacing } from '../../constants/theme';
import { getBadgeStyle } from '../../constants/badges';
import { withAlpha } from '../../utils/color';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import type { BadgeContract } from '../../types/badge';

export const BADGE_TILE_SIZE = 56;

interface BadgeTileProps {
  badge: BadgeContract;
  onPress: (badge: BadgeContract) => void;
}

/** Localized badge name: the app's own copy first, the backend's as the fallback for new codes. */
export function useBadgeName() {
  const { t } = useTranslation();
  return (badge: BadgeContract) => t(`badges.items.${badge.code}.name`, { defaultValue: badge.name });
}

/**
 * One badge in the profile row: an accent disc with an `ink` icon when earned, a
 * muted translucent disc with a dimmed icon when not. Tapping explains it.
 */
export function BadgeTile({ badge, onPress }: BadgeTileProps) {
  const { t } = useTranslation();
  const badgeName = useBadgeName();
  const { icon, color } = getBadgeStyle(badge.code);
  const name = badgeName(badge);

  return (
    <Pressable
      onPress={() => onPress(badge)}
      accessibilityRole="button"
      accessibilityLabel={t(badge.earned ? 'badges.tileA11yEarned' : 'badges.tileA11yLocked', { name })}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      testID={`badge-${badge.code}`}
    >
      <View style={[styles.disc, badge.earned ? { backgroundColor: color } : styles.discLocked]}>
        <Icon name={icon} size={24} color={badge.earned ? colors.ink : withAlpha(colors.paper, 0.4)} />
      </View>
      <Text variant="caption" tone={badge.earned ? 'primary' : 'secondary'} align="center" numberOfLines={2}>
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 84,
    alignItems: 'center',
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  disc: {
    width: BADGE_TILE_SIZE,
    height: BADGE_TILE_SIZE,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discLocked: {
    backgroundColor: withAlpha(colors.paper, fillOpacity.subtle),
  },
});
