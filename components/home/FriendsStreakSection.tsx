import { memo, useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { Row } from '../layout/row';
import { FriendStreakCard } from './FriendStreakCard';
import type { FriendStreakViewModel } from '../../services/adapters/followAdapter';
import { colors, fillOpacity, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { HOME_EDGE_INSET } from '../../constants/feed';
import { useImagesDrawn } from '../../hooks/useImagesDrawn';

/** The most skeleton circles shown: about what fits across the screen. */
const MAX_SKELETON_CARDS = 5;
/** Cards the row renders up front — the ones whose photos the skeleton waits for. */
const INITIAL_CARDS = 8;

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
  // Sprint 10: the row stays a skeleton until every friend's profile picture is
  // on screen, so the circles appear together (the real row renders invisibly
  // underneath — see useImagesDrawn).

  const awaitedIds = useMemo(
    () =>
      friends
        .slice(0, INITIAL_CARDS)
        .filter((friend) => friend.avatarUrl)
        .map((friend) => friend.userId),
    [friends],
  );

  const { ready: avatarsReady, onDrawn } = useImagesDrawn(awaitedIds, { enabled: !loading && !error });
  const skeletonCount = loading ? 2 : Math.min(friends.length, MAX_SKELETON_CARDS);

  const renderItem = useCallback(
    ({ item }: { item: FriendStreakViewModel }) => <FriendStreakCard friend={item} onAvatarLoadEnd={onDrawn} />,
    [onDrawn],
  );

  const skeletonRow = (
    <View style={styles.skeletonRow}>
      {Array.from({ length: skeletonCount }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );

  return (
    <View>
      <Row justify="space-between" align="center" style={[styles.header, styles.inset]}>
        <Text variant="subheader">{t('home.streaksTitle')}</Text>

        {onSeeMore && friends.length > 0 && (
          <Row pressable onPress={onSeeMore} gap="xs">
            <Text variant="label">{t('home.seeMore')}</Text>
          </Row>
        )}
      </Row>

      {loading ? (
        <View style={styles.inset} testID="friends-streak-skeleton">
          {skeletonRow}
        </View>
      ) : error ? (
        <Text variant="body" tone="secondary" style={[styles.message, styles.inset]}>
          {t('home.streaksErrorMessage')}
        </Text>
      ) : friends.length === 0 ? (
        <Text variant="body" tone="secondary" style={[styles.message, styles.inset]}>
          {t('home.emptyStreaksMessage')}
        </Text>
      ) : (
        <View>
          <View
            style={!avatarsReady && styles.hidden}
            pointerEvents={avatarsReady ? 'auto' : 'none'}
            accessibilityElementsHidden={!avatarsReady}
            importantForAccessibility={avatarsReady ? 'auto' : 'no-hide-descendants'}
          >
            <FlatList
              data={friends}
              initialNumToRender={INITIAL_CARDS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.userId}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={FriendSeparator}
              renderItem={renderItem}
            />
          </View>
          {!avatarsReady ? (
            <View style={[styles.inset, styles.skeletonOverlay]} pointerEvents="none" testID="friends-streak-skeleton">
              {skeletonRow}
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  // The row spans the whole screen (Home's list has no side padding of its
  // own any more), and only its content starts and ends at Home's inset: a
  // circle scrolls all the way to the screen's edge instead of disappearing
  // into a strip of padding before it.
  listContent: {
    paddingHorizontal: HOME_EDGE_INSET,
  },
  inset: {
    paddingHorizontal: HOME_EDGE_INSET,
  },
  separator: {
    width: spacing.md,
  },
  hidden: {
    opacity: 0,
  },
  skeletonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
