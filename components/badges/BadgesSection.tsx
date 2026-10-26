import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing } from '../../constants/theme';
import { getMyBadges, getUserBadges } from '../../services/badges/badges.service';
import { Text } from '../ui/text';
import { BadgeTile } from './BadgeTile';
import { BadgeDetailSheet } from './BadgeDetailSheet';
import type { BadgeContract } from '../../types/badge';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { queryKeys, staleTimes } from '../../services/cache/queries';

interface BadgesSectionProps {
  /** Omit for the session user's own badges (GET /badges/me). */
  userId?: string;
  /** `row` (default): a titled, horizontally scrolling row. `grid`: every badge
   * in a wrapping grid under just the earned count — the Badges screen, which
   * has its own title. */
  layout?: 'row' | 'grid';
}

/**
 * Badges row for a profile, earned ones first. Renders nothing while loading, on
 * error, or when the backend returns [] (a private profile you do not follow):
 * a missing badge row must never read as an error on the profile.
 */
export function BadgesSection({ userId, layout = 'row' }: BadgesSectionProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<BadgeContract | null>(null);
  const isOwn = !userId;
  // Cached per profile; a log (own badges) or the screen's pull-to-refresh
  // invalidates the key, which refetches it while this row is on screen.
  const { data } = useCachedQuery(
    userId ? queryKeys.userBadges(userId) : queryKeys.myBadges,
    () => (userId ? getUserBadges(userId) : getMyBadges()),
    { staleTime: staleTimes.catalog, persist: isOwn },
  );
  const badges = Array.isArray(data) ? data : [];

  if (badges.length === 0) return null;

  const earnedCount = badges.filter((badge) => badge.earned).length;
  // Stable sort: earned first, catalog order kept inside each group.
  const sorted = [...badges].sort((a, b) => Number(b.earned) - Number(a.earned));

  if (layout === 'grid') {
    return (
      <View style={styles.wrapper} testID="badges-grid">
        <Text variant="label" weight="bold" tone="secondary" align="center">
          {t('badges.earnedCount', { earned: earnedCount, total: badges.length })}
        </Text>
        <View style={styles.grid}>
          {sorted.map((badge) => (
            <View key={badge.code} style={styles.gridCell}>
              <BadgeTile badge={badge} onPress={setSelected} size="large" />
            </View>
          ))}
        </View>
        <BadgeDetailSheet badge={selected} isOwn={isOwn} onClose={() => setSelected(null)} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text variant="subheader">{t('badges.title')}</Text>
        <Text variant="label" weight="bold" tone="secondary">
          {t('badges.earnedCount', { earned: earnedCount, total: badges.length })}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {sorted.map((badge) => (
          <BadgeTile key={badge.code} badge={badge} onPress={setSelected} />
        ))}
      </ScrollView>
      <BadgeDetailSheet badge={selected} isOwn={isOwn} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    gap: spacing.sm,
  },
  // Three to a row: each cell is exactly a third of the width, its badge
  // centered in it; a last row of one or two stays centered too.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: spacing.lg,
  },
  gridCell: {
    width: '33.333%',
    alignItems: 'center',
  },
});
