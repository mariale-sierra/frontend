import { memo, useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { Row } from '../layout/row';
import { FriendStreakCard } from './FriendStreakCard';
import type { FriendStreakViewModel } from '../../services/adapters/followAdapter';
import { colors, fillOpacity, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface FriendsStreakSectionProps {
  friends: FriendStreakViewModel[];
  loading?: boolean;
  error?: boolean;
  onSeeMore?: () => void;
}

function SkeletonCard() {
  return <View style={styles.skeletonCard} />;
}

function FriendSeparator() {
  return <View style={styles.separator} />;
}

export const FriendsStreakSection = memo(function FriendsStreakSection({
  friends,
  loading = false,
  error = false,
  onSeeMore,
}: FriendsStreakSectionProps) {
  const { t } = useTranslation();

  const renderItem = useCallback(
    ({ item }: { item: FriendStreakViewModel }) => <FriendStreakCard friend={item} />,
    [],
  );

  return (
    <View>
      <Row justify="space-between" align="center" style={styles.header}>
        <Text variant="subheader">{t('home.streaksTitle')}</Text>

        {onSeeMore && friends.length > 0 && (
          <Row pressable onPress={onSeeMore} gap="xs">
            <Text variant="label">{t('home.seeMore')}</Text>
          </Row>
        )}
      </Row>

      {loading ? (
        <View style={styles.bleed}>
          <View style={styles.skeletonRow}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </View>
      ) : error ? (
        <Text variant="body" tone="secondary" style={styles.message}>
          {t('home.streaksErrorMessage')}
        </Text>
      ) : friends.length === 0 ? (
        <Text variant="body" tone="secondary" style={styles.message}>
          {t('home.emptyStreaksMessage')}
        </Text>
      ) : (
        <View style={styles.bleed}>
          <FlatList
            data={friends}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={FriendSeparator}
            renderItem={renderItem}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  // Real, true edge-to-edge — fixed 2026-09-25, per explicit follow-up "I
  // don't think you quite got me on the streak scroll, as I said I want no
  // padding, at all, I want for the circles to touch the edge of the
  // screen with no problem or barrier": the earlier fix only removed the
  // EXTRA padding this component added on top of the outer feed list's own
  // `paddingHorizontal: spacing.lg` (index.tsx's `listContent`) — the
  // leading/trailing edges still matched that 24px inset, not the screen's
  // true edge. `marginHorizontal: -spacing.lg` cancels that inherited
  // padding for this row specifically (the `header` above stays padded,
  // aligned with the rest of the screen — only the scrolling row breaks
  // out), so with `listContent` having no padding of its own, the first and
  // last circles now sit flush against the real screen edges. Nothing here
  // clips them: `FriendStreakCard`'s own avatar sits centered with margin
  // inside its card, so touching the edge doesn't cut off any of its
  // circular shape.
  bleed: {
    marginHorizontal: -spacing.lg,
  },
  // A small nudge off the true edge for the first circle's REST position —
  // per explicit follow-up "I want the initial position of the first
  // circle at the left, to move a bit to the right. This does not affect
  // the scroll gap problem you solved": leading-only (no matching
  // `paddingRight`), so the trailing edge still sits flush at the true
  // screen edge once scrolled all the way — only where the row starts
  // moved.
  listContent: {
    paddingLeft: spacing.lg,
  },
  separator: {
    width: spacing.md,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  // Was `withAlpha(colors.paper, 0.1)` — a one-off value close to, but not
  // quite, the shared Skeleton primitive's own `subtle` fill (0.08),
  // purely because this predates that primitive and typed its own number.
  // Converged onto the real shared token — see `fillOpacity`.
  skeletonCard: {
    width: 58,
    height: 58 + spacing.xl,
    borderRadius: radius.big,
    backgroundColor: withAlpha(colors.paper, fillOpacity.subtle),
  },
  message: {
    paddingVertical: spacing.sm,
  },
});
