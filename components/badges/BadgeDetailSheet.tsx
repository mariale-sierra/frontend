import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheetModal } from '../ui/bottomSheetModal';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { badgeColors, colors, fillOpacity, spacing } from '../../constants/theme';
import { getBadgeMetric, getBadgeStyle } from '../../constants/badges';
import { LockedDisc, MetallicDisc } from './MetallicDisc';
import { withAlpha } from '../../utils/color';
import { BADGE_TILE_SIZE, useBadgeName } from './BadgeTile';
import type { BadgeContract } from '../../types/badge';

interface BadgeDetailSheetProps {
  badge: BadgeContract | null;
  /** Whose badge it is: your own gets "keep going" copy, someone else's does not. */
  isOwn: boolean;
  onClose: () => void;
}

const DISC_SIZE = BADGE_TILE_SIZE * 1.5;
const BAR_HEIGHT = 8;

/** What a badge means and how to get it: name, criterion (the catalog's own description),
 * how it is counted (Sprint 10, B2) and progress. */
export function BadgeDetailSheet({ badge, isOwn, onClose }: BadgeDetailSheetProps) {
  const { t } = useTranslation();
  const badgeName = useBadgeName();

  if (!badge) return null;

  const { icon, tier } = getBadgeStyle(badge.code);
  const metalColor = badgeColors[tier].base;
  const description = t(`badges.items.${badge.code}.description`, { defaultValue: badge.description });
  const ratio = badge.target > 0 ? Math.min(1, badge.progress / badge.target) : 0;
  const metric = getBadgeMetric(badge.code);

  return (
    <BottomSheetModal visible onClose={onClose} glass maxHeight="60%">
      <View style={styles.content}>
        {badge.earned ? (
          <MetallicDisc tier={tier} size={DISC_SIZE}>
            <Icon name={icon} size={36} color={colors.ink} />
          </MetallicDisc>
        ) : (
          <LockedDisc tier={tier} size={DISC_SIZE} progress={ratio}>
            <Icon name={icon} size={36} color={withAlpha(colors.paper, 0.4)} />
          </LockedDisc>
        )}
        <Text variant="subheader" align="center">
          {badgeName(badge)}
        </Text>
        <Text variant="body" tone="secondary" align="center">
          {description}
        </Text>
        {metric ? (
          <Text variant="caption" tone="secondary" align="center" testID="badge-rule">
            {t(`badges.rules.${metric}`)}
          </Text>
        ) : null}

        <View style={styles.progressBlock}>
          <View style={styles.track}>
            <View
              style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: badge.earned ? metalColor : colors.neutral }]}
            />
          </View>
          <Text variant="caption" tone="secondary" align="center">
            {badge.earned
              ? t(isOwn ? 'badges.earnedOwn' : 'badges.earnedOther')
              : t(isOwn ? 'badges.progressOwn' : 'badges.progressOther', {
                  progress: badge.progress,
                  target: badge.target,
                })}
          </Text>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.base,
    paddingBottom: spacing.xl,
  },
  progressBlock: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  track: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
    backgroundColor: withAlpha(colors.paper, fillOpacity.subtle),
  },
  fill: {
    height: '100%',
    borderRadius: BAR_HEIGHT / 2,
  },
});
