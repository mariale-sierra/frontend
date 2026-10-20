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
}

/**
 * Badges row for a profile, earned ones first. Renders nothing while loading, on
 * error, or when the backend returns [] (a private profile you do not follow):
 * a missing badge row must never read as an error on the profile.
 */
export function BadgesSection({ userId }: BadgesSectionProps) {
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
});
