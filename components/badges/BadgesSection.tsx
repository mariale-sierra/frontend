import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing } from '../../constants/theme';
import { getMyBadges, getUserBadges } from '../../services/badges/badges.service';
import { Text } from '../ui/text';
import { BadgeTile } from './BadgeTile';
import { BadgeDetailSheet } from './BadgeDetailSheet';
import type { BadgeContract } from '../../types/badge';

interface BadgesSectionProps {
  /** Omit for the session user's own badges (GET /badges/me). */
  userId?: string;
  /** Bumped by the parent screen's pull-to-refresh to refetch. */
  refreshSignal?: number;
}

/**
 * Badges row for a profile, earned ones first. Renders nothing while loading, on
 * error, or when the backend returns [] (a private profile you do not follow):
 * a missing badge row must never read as an error on the profile.
 */
export function BadgesSection({ userId, refreshSignal }: BadgesSectionProps) {
  const { t } = useTranslation();
  const [badges, setBadges] = useState<BadgeContract[]>([]);
  const [selected, setSelected] = useState<BadgeContract | null>(null);
  const isOwn = !userId;

  useEffect(() => {
    let active = true;
    (userId ? getUserBadges(userId) : getMyBadges())
      .then((data) => {
        if (active) setBadges(data);
      })
      .catch(() => {
        // Keep whatever is shown; the global interceptor handles toasts.
      });
    return () => {
      active = false;
    };
  }, [userId, refreshSignal]);

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
