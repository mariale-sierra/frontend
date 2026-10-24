import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '../../constants/theme';
import { getBadgeStyle } from '../../constants/badges';
import { withAlpha } from '../../utils/color';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { LockedDisc, MetallicDisc } from './MetallicDisc';
import type { BadgeContract } from '../../types/badge';

export const BADGE_TILE_SIZE = 56;
/** The Badges screen's bigger badges: three to a row (2026-10-23). */
export const BADGE_TILE_SIZE_LARGE = 88;

interface BadgeTileProps {
  badge: BadgeContract;
  onPress: (badge: BadgeContract) => void;
  /** `large`: the Badges screen's grid — a bigger disc and icon, and the tile
   * fills its grid cell instead of the row's fixed width. */
  size?: 'default' | 'large';
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
export function BadgeTile({ badge, onPress, size = 'default' }: BadgeTileProps) {
  const { t } = useTranslation();
  const badgeName = useBadgeName();
  const { icon, tier } = getBadgeStyle(badge.code);
  const name = badgeName(badge);
  const large = size === 'large';

  return (
    <Pressable
      onPress={() => onPress(badge)}
      accessibilityRole="button"
      accessibilityLabel={t(badge.earned ? 'badges.tileA11yEarned' : 'badges.tileA11yLocked', { name })}
      style={({ pressed }) => [styles.tile, large && styles.tileLarge, pressed && styles.pressed]}
      testID={`badge-${badge.code}`}
    >
      {badge.earned ? (
        // Earned: its tier's metal (bronze / silver / gold), an `ink` icon on it.
        <MetallicDisc tier={tier} size={large ? BADGE_TILE_SIZE_LARGE : BADGE_TILE_SIZE}>
          <Icon name={icon} size={large ? 36 : 24} color={colors.ink} />
        </MetallicDisc>
      ) : (
        // Not yet: a dim disc ringed by its progress, in the metal it leads to.
        <LockedDisc
          tier={tier}
          size={large ? BADGE_TILE_SIZE_LARGE : BADGE_TILE_SIZE}
          progress={badge.target > 0 ? badge.progress / badge.target : 0}
        >
          <Icon name={icon} size={large ? 36 : 24} color={withAlpha(colors.paper, 0.4)} />
        </LockedDisc>
      )}
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
  // Fills its grid cell (a third of the row) on the Badges screen.
  tileLarge: {
    width: '100%',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
});
