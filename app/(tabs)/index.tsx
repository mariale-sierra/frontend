import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import ScreenBackground from '../../components/layout/screenBackground';
import { Divider } from '../../components/ui/divider';
import { Icon } from '../../components/ui/icon';
import { Loader } from '../../components/ui/loader';
import { Text } from '../../components/ui/text';
import { Row } from '../../components/layout/row';
import { ActiveChallengeSection } from '../../components/home/ActiveChallengeSection';
import { FeedPostCard } from '../../components/home/FeedPostCard';
import { FriendsStreakSection } from '../../components/home/FriendsStreakSection';
import type { FriendStreakViewModel } from '../../services/adapters/followAdapter';
import { PostCardSkeleton } from '../../components/home/PostCardSkeleton';
import { EmptyFeed } from '../../components/home/EmptyFeed';
import { FeedErrorState } from '../../components/home/FeedErrorState';
import type { HomeActiveChallengeViewModel } from '../../services/adapters/homeAdapter';
import { getHomeChallengesSorted } from '../../services/adapters/homeAdapter';
import { groupLatestPhotoByChallengeId } from '../../services/adapters/challengeState';
import { getMyChallenges } from '../../services/user/user.service';
import { getMyProgressPhotos } from '../../services/challenge/challenge.service';
import { getHomeFeed } from '../../services/feed/feed.service';
import { toFeedPostViewModels } from '../../services/adapters/feedAdapter';
import type { FeedPostViewModel } from '../../services/adapters/feedAdapter';
import { getFollowingStreaks } from '../../services/follow/follow.service';
import { toFriendStreakViewModels } from '../../services/adapters/followAdapter';
import { colors, spacing } from '../../constants/theme';
import { formatTodayLabel, hoursUntilMidnight } from '../../utils/time';

export default function Home() {
  const { username } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Same source as the Challenges tab (services/user/user.service.ts getMyChallenges,
  // i.e. GET /users/me/challenges) so the two screens always show the same set of
  // challenges — this used to mix hardcoded mock badges with a single, separately
  // fetched "current" challenge from /challenges/progress.
  const [challenges, setChallenges] = useState<HomeActiveChallengeViewModel[]>([]);
  const [challengeLoading, setChallengeLoading] = useState(true);

  const [feedPosts, setFeedPosts] = useState<FeedPostViewModel[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
  const [feedNextCursor, setFeedNextCursor] = useState<string | undefined>(undefined);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);

  const [friendStreaks, setFriendStreaks] = useState<FriendStreakViewModel[]>([]);
  const [friendStreaksLoading, setFriendStreaksLoading] = useState(true);
  const [friendStreaksError, setFriendStreaksError] = useState(false);

  const hoursLeft = hoursUntilMidnight();

  // Refetches on focus (not just on first mount) so returning to this tab after
  // joining/completing a challenge elsewhere — or logging today's photo, which
  // flips a card from active to completed — shows up-to-date state.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getMyChallenges(), getMyProgressPhotos()])
        .then(([data, myPhotos]) => {
          if (!active) return;
          const latestPhotoByChallengeId = groupLatestPhotoByChallengeId(myPhotos ?? []);
          setChallenges(getHomeChallengesSorted(data ?? [], latestPhotoByChallengeId));
        })
        .catch(() => {
          if (active) setChallenges([]);
        })
        .finally(() => {
          if (active) setChallengeLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setFeedLoading(true);
      getHomeFeed()
        .then(({ posts, nextCursor }) => {
          if (!active) return;
          setFeedPosts(toFeedPostViewModels(posts));
          setFeedNextCursor(nextCursor);
          setFeedError(false);
        })
        .catch(() => {
          // Feed failed to load — show the dedicated error state below rather
          // than showing stale/fake data.
          if (!active) return;
          setFeedPosts([]);
          setFeedNextCursor(undefined);
          setFeedError(true);
        })
        .finally(() => {
          if (active) setFeedLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setFriendStreaksLoading(true);
      getFollowingStreaks()
        .then((rows) => {
          if (!active) return;
          setFriendStreaks(toFriendStreakViewModels(rows));
          setFriendStreaksError(false);
        })
        .catch(() => {
          if (!active) return;
          setFriendStreaks([]);
          setFriendStreaksError(true);
        })
        .finally(() => {
          if (active) setFriendStreaksLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const loadMoreFeed = useCallback(() => {
    if (feedLoadingMore || feedLoading || !feedNextCursor) return;
    setFeedLoadingMore(true);
    getHomeFeed(feedNextCursor)
      .then(({ posts, nextCursor }) => {
        setFeedPosts((prev) => [...prev, ...toFeedPostViewModels(posts)]);
        setFeedNextCursor(nextCursor);
      })
      .catch(() => {
        // Leave the already-loaded posts on screen; simply stop paginating
        // rather than surfacing a second error state mid-scroll.
        setFeedNextCursor(undefined);
      })
      .finally(() => setFeedLoadingMore(false));
  }, [feedLoadingMore, feedLoading, feedNextCursor]);

  function renderItem({ item }: { item: FeedPostViewModel }) {
    return <FeedPostCard post={item} />;
  }

  const listHeader = (
    <View style={styles.listHeader}>
      <Row justify="space-between" align="flex-start">
        <View style={styles.greetingBlock}>
          <Text variant="caption" tone="secondary" style={styles.dateLabel}>
            {formatTodayLabel()}
          </Text>
          <Text variant="title">{t('home.greeting', { name: username ?? '' })}</Text>
        </View>

        <Row gap="sm">
          {/* Messaging/notifications routes exist but aren't wired to real
              unread state yet — the dot below is decorative for now. */}
          <Pressable style={styles.iconButton} onPress={() => router.push('/messaging')}>
            <Icon name="chatbubble-ellipses-outline" size={22} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => router.push('/notifications')}>
            <Icon name="notifications-outline" size={22} />
            <View style={styles.notificationDot} />
          </Pressable>
        </Row>
      </Row>

      <View style={styles.challengeArea}>
        {challengeLoading ? (
          <View style={styles.challengeLoadingArea}>
            <Loader visible={true} overlayStyle={styles.loaderTransparent} />
          </View>
        ) : challenges.length > 0 ? (
          <ActiveChallengeSection challenges={challenges} hoursLeft={hoursLeft} />
        ) : (
          <View style={styles.center}>
            <Text variant="body" tone="secondary">{t('home.noActiveChallenge')}</Text>
          </View>
        )}
      </View>

      <View style={styles.friendsArea}>
        <FriendsStreakSection
          friends={friendStreaks}
          loading={friendStreaksLoading}
          error={friendStreaksError}
          onSeeMore={() => router.push('/home/streaks')}
        />
      </View>

      <Divider style={styles.divider} />
    </View>
  );

  return (
    <ScreenBackground variant="default">
      <FlatList
        data={feedPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          feedLoading ? (
            <View style={styles.feedSkeletonArea}>
              <PostCardSkeleton />
              <View style={styles.skeletonSpacer} />
              <PostCardSkeleton />
            </View>
          ) : feedError ? (
            <FeedErrorState />
          ) : (
            <EmptyFeed />
          )
        }
        ListFooterComponent={
          feedLoadingMore ? (
            <View style={styles.feedFooterLoading}>
              <Loader visible={true} overlayStyle={styles.loaderTransparent} />
            </View>
          ) : null
        }
        onEndReached={loadMoreFeed}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  listHeader: {
    // ScreenBackground already pads for the safe-area top inset — this is
    // just the small gap between that and the greeting row, matching the
    // wireframe's status-bar-to-content spacing.
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xl,
  },
  greetingBlock: {
    gap: spacing.xs,
  },
  dateLabel: {
    textTransform: 'uppercase',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  challengeArea: {
    marginHorizontal: -spacing.lg,
  },
  challengeLoadingArea: {
    height: 120,
  },
  loaderTransparent: {
    backgroundColor: 'transparent',
  },
  center: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  friendsArea: {},
  divider: {
    marginTop: spacing.xs,
  },
  feedSkeletonArea: {
    paddingTop: spacing.xs,
  },
  skeletonSpacer: {
    height: spacing['2xl'],
  },
  feedFooterLoading: {
    height: 60,
  },
  separator: {
    height: spacing['2xl'],
  },
});
