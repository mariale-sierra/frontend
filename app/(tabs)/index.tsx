import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import ScreenBackground from '../../components/layout/screenBackground';
import { AccentPill } from '../../components/ui/accentPill';
import { Divider } from '../../components/ui/divider';
import { Icon } from '../../components/ui/icon';
import { Loader } from '../../components/ui/loader';
import { Text } from '../../components/ui/text';
import { Row } from '../../components/layout/row';
import { CoachMark } from '../../components/onboarding/CoachMark';
import { ACTIVE_CHALLENGE_SNAP_INTERVAL, ActiveChallengeSection } from '../../components/home/ActiveChallengeSection';
import { FeedPostCard } from '../../components/home/FeedPostCard';
import { FriendsStreakSection } from '../../components/home/FriendsStreakSection';
import type { FriendStreakViewModel } from '../../services/adapters/followAdapter';
import { HomeContentSkeleton } from '../../components/home/HomeContentSkeleton';
import { EmptyFeed } from '../../components/home/EmptyFeed';
import { FeedErrorState } from '../../components/home/FeedErrorState';
import type { HomeActiveChallengeViewModel } from '../../services/adapters/homeAdapter';
import { getHomeChallengesSorted, getHomeGlowColors } from '../../services/adapters/homeAdapter';
import { groupLatestPhotoByChallengeId } from '../../services/adapters/challengeState';
import { getMyChallenges } from '../../services/user/user.service';
import { getMyProgressPhotos } from '../../services/challenge/challenge.service';
import { getHomeFeed, type FeedPage } from '../../services/feed/feed.service';
import { toCachedFeedPostViewModels } from '../../services/adapters/feedAdapter';
import type { FeedPostViewModel } from '../../services/adapters/feedAdapter';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { queryKeys, staleTimes } from '../../services/cache/queries';
import { setQueryData } from '../../services/cache/queryCache';
import { getFollowingStreaks } from '../../services/follow/follow.service';
import { toFriendStreakViewModels } from '../../services/adapters/followAdapter';
import { colors, spacing, textOpacity } from '../../constants/theme';
import { HOME_GRADIENT_EDGE, HOME_GRADIENT_SCROLLS, USE_HOME_ACTIVITY_GRADIENT } from '../../constants/screenBackground';
import { BOTTOM_NAV_HEIGHT } from '../../constants/bottomNav';
import { FORCE_SHOW_ONBOARDING_PREVIEWS } from '../../constants/onboardingDebug';
import { formatTodayLabel, hoursUntilMidnight } from '../../utils/time';
import { withAlpha } from '../../utils/color';
import { useNotificationsStore } from '../../store/notificationsStore';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';
import { hasSeenLogCoachMark, markLogCoachMarkSeen } from '../../utils/logCoachMark';
import { FEED_POST_GAP, HOME_EDGE_INSET } from '../../constants/feed';

function FeedSeparator() {
  return <View style={styles.separator} />;
}

export default function Home() {
  const { username } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const unreadNotifications = useNotificationsStore((s) => s.unreadCount);

  // Same source as the Challenges tab (GET /users/me/challenges + the user's own
  // photos for "posted today"), read through the shared cache: switching tabs or
  // coming back from another screen reuses what is loaded instead of refetching
  // it, and a log/join elsewhere invalidates exactly these keys.
  const challengesQuery = useCachedQuery(queryKeys.myChallenges, getMyChallenges, {
    staleTime: staleTimes.activity,
    persist: true,
  });
  const photosQuery = useCachedQuery(queryKeys.myPhotos, getMyProgressPhotos, {
    staleTime: staleTimes.activity,
    persist: true,
  });
  const challenges = useMemo<HomeActiveChallengeViewModel[]>(
    () =>
      getHomeChallengesSorted(
        challengesQuery.data ?? [],
        groupLatestPhotoByChallengeId(photosQuery.data ?? []),
      ),
    [challengesQuery.data, photosQuery.data],
  );
  const challengeLoading = challengesQuery.isLoading || photosQuery.isLoading;

  // The carousel's scroll offset, which the background light follows: it takes
  // the color of the card in view, cross-fading to the next as the carousel scrolls.
  const carouselScrollX = useRef(new Animated.Value(0)).current;

  // How far the feed is scrolled, so the background light rides up with the page
  // instead of staying fixed behind the posts.
  const listScrollY = useRef(new Animated.Value(0)).current;
  const handleListScroll = useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { y: listScrollY } } }], { useNativeDriver: true }),
    [listScrollY],
  );
  const backgroundPages = useMemo(
    () =>
      USE_HOME_ACTIVITY_GRADIENT
        ? { colors: getHomeGlowColors(challenges), scrollX: carouselScrollX, pageWidth: ACTIVE_CHALLENGE_SNAP_INTERVAL }
        : undefined,
    [carouselScrollX, challenges],
  );

  const feedQuery = useCachedQuery<FeedPage>(queryKeys.feed, () => getHomeFeed(), {
    staleTime: staleTimes.activity,
    persist: true,
  });
  const feedPosts = useMemo(() => toCachedFeedPostViewModels(feedQuery.data?.posts ?? []), [feedQuery.data]);
  const feedNextCursor = feedQuery.data?.nextCursor;
  const feedLoading = feedQuery.isLoading;
  // Only an error with nothing to show: a failed background refresh keeps the cached feed.
  const feedError = !feedQuery.data && Boolean(feedQuery.error);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);

  const streaksQuery = useCachedQuery(queryKeys.followingStreaks, getFollowingStreaks, {
    staleTime: staleTimes.social,
    persist: true,
  });
  const friendStreaks = useMemo<FriendStreakViewModel[]>(
    () => toFriendStreakViewModels(streaksQuery.data ?? []),
    [streaksQuery.data],
  );
  const friendStreaksLoading = streaksQuery.isLoading;
  const friendStreaksError = !streaksQuery.data && Boolean(streaksQuery.error);

  // Onboarding Stage 2's one coach mark — points at the tab bar's Log FAB,
  // shown once ever per device (utils/logCoachMark.ts). Checked once on
  // mount, not tied to `isReady`'s own loading gate below (loading it in
  // parallel is fine; it only ever RENDERS once `isReady` is true, see JSX).
  const [showLogCoachMark, setShowLogCoachMark] = useState(false);
  useEffect(() => {
    if (FORCE_SHOW_ONBOARDING_PREVIEWS) {
      setShowLogCoachMark(true);
      return;
    }
    hasSeenLogCoachMark().then((seen) => {
      if (!seen) setShowLogCoachMark(true);
    });
  }, []);
  const dismissLogCoachMark = useCallback(() => {
    setShowLogCoachMark(false);
    markLogCoachMarkSeen();
  }, []);

  const hoursLeft = hoursUntilMidnight();

  // Coming back to Home only asks the server for what is older than its
  // staleTime; anything changed in the app was already invalidated (or patched)
  // by the mutation itself, so most tab switches cost no request at all.
  const revalidateChallenges = challengesQuery.revalidate;
  const revalidatePhotos = photosQuery.revalidate;
  const revalidateFeed = feedQuery.revalidate;
  const revalidateStreaks = streaksQuery.revalidate;
  useFocusEffect(
    useCallback(() => {
      void revalidateChallenges();
      void revalidatePhotos();
      void revalidateFeed();
      void revalidateStreaks();
    }, [revalidateChallenges, revalidatePhotos, revalidateFeed, revalidateStreaks]),
  );

  // Pull-to-refresh: always asks the server for all four, independently (one
  // failing doesn't block the others; each keeps its cached data on failure).
  const refetchChallenges = challengesQuery.refetch;
  const refetchPhotos = photosQuery.refetch;
  const refetchFeed = feedQuery.refetch;
  const refetchStreaks = streaksQuery.refetch;
  const refreshHome = useCallback(
    () => Promise.all([refetchChallenges(), refetchPhotos(), refetchFeed(), refetchStreaks()]),
    [refetchChallenges, refetchPhotos, refetchFeed, refetchStreaks],
  );
  const { refreshing, onRefresh } = usePullToRefresh(refreshHome);

  const loadMoreFeed = useCallback(() => {
    if (feedLoadingMore || feedLoading || !feedNextCursor) return;
    setFeedLoadingMore(true);
    getHomeFeed(feedNextCursor)
      .then(({ posts, nextCursor }) => {
        // Appended to the cached pages, skipping any post a refresh already brought in.
        setQueryData<FeedPage>(queryKeys.feed, (previous) => {
          if (!previous) return previous;
          const known = new Set(previous.posts.map((post) => post.id));
          return { posts: [...previous.posts, ...posts.filter((post) => !known.has(post.id))], nextCursor };
        });
      })
      .catch(() => {
        // Leave the already-loaded posts on screen; simply stop paginating
        // rather than surfacing a second error state mid-scroll.
        setQueryData<FeedPage>(queryKeys.feed, (previous) => (previous ? { ...previous, nextCursor: undefined } : previous));
      })
      .finally(() => setFeedLoadingMore(false));
  }, [feedLoadingMore, feedLoading, feedNextCursor]);

  // `useCallback` (not a plain function declaration) so FlatList sees a
  // stable `renderItem` reference across re-renders — a new function
  // identity every render defeats FlatList's own cell-level memoization and
  // forces every visible row to re-render even when its own data hasn't
  // changed (e.g. while the friend-streaks section resolves independently).
  // B4: the viewer deleted one of their own posts from its "..." menu — the
  // card already dropped it from the cached feed (no refetch, no scroll jump).
  const showSuccess = useErrorNotificationStore((state) => state.showSuccess);
  const handlePostDeleted = useCallback(() => {
    showSuccess({ message: t('home.postOptions.deleteSuccess') });
  }, [showSuccess, t]);

  const renderItem = useCallback(
    ({ item }: { item: FeedPostViewModel }) => (
      <FeedPostCard post={item} onDeleted={handlePostDeleted} edgeToEdgeInset={HOME_EDGE_INSET} />
    ),
    [handlePostDeleted],
  );

  // One combined gate instead of three independent loading flags each
  // rendering their own fallback — the screen reveals once, fully populated,
  // instead of the hero card / streaks / feed popping in separately as each
  // fetch happens to resolve. See HomeContentSkeleton.
  const isReady = !challengeLoading && !feedLoading && !friendStreaksLoading;

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
      <Row justify="space-between" align="flex-start" style={styles.inset}>
        <View style={styles.greetingBlock}>
          <Text variant="caption" tone="secondary" style={styles.dateLabel}>
            {formatTodayLabel()}
          </Text>
          <Text variant="title">{t('home.greeting', { name: username ?? '' })}</Text>
        </View>

        <Row gap="sm">
          <Pressable style={styles.iconButton} onPress={() => router.push('/messaging')}>
            <Icon name="chatbubble-ellipses-outline" size={22} />
          </Pressable>
          {/* B3: the dot is the real unread count (store/notificationsStore). */}
          <Pressable
            style={styles.iconButton}
            onPress={() => router.push('/notifications')}
            accessibilityRole="button"
            accessibilityLabel={t('notifications.title')}
          >
            <Icon name="notifications-outline" size={22} />
            {unreadNotifications > 0 ? <View style={styles.notificationDot} /> : null}
          </Pressable>
        </Row>
      </Row>

      {!isReady ? (
        <HomeContentSkeleton />
      ) : (
        <>
          <View style={styles.challengeArea}>
            {challenges.length > 0 ? (
              <ActiveChallengeSection challenges={challenges} hoursLeft={hoursLeft} scrollX={carouselScrollX} />
            ) : (
              <View style={[styles.center, styles.inset]}>
                <Icon name="trophy-outline" size={32} color={withAlpha(colors.paper, textOpacity.tertiary)} />
                <Text variant="body" tone="secondary" align="center">{t('home.noActiveChallenge')}</Text>
                <View style={styles.emptyStateCta}>
                  <AccentPill
                    label={t('challenges.joinOrCreate')}
                    color={colors.paper}
                    variant="filled"
                    onPress={() => router.push('/(tabs)/challenges?view=explore')}
                  />
                </View>
              </View>
            )}
          </View>

          <View style={styles.friendsArea}>
            <FriendsStreakSection
              friends={friendStreaks}
              error={friendStreaksError}
              onSeeMore={() => router.push('/home/streaks')}
            />
          </View>

          <Divider style={[styles.divider, styles.dividerInset]} />
        </>
      )}
      </View>
    ),
    [carouselScrollX, challenges, friendStreaks, friendStreaksError, hoursLeft, isReady, router, t, unreadNotifications, username],
  );
  const listEmptyComponent = useMemo(
    () => (!isReady ? null : <View style={styles.inset}>{feedError ? <FeedErrorState /> : <EmptyFeed />}</View>),
    [feedError, isReady],
  );
  const listContentStyle = useMemo(
    () => [styles.listContent, { paddingBottom: insets.bottom + spacing['2xl'] }],
    [insets.bottom],
  );

  return (
    <ScreenBackground
      variant="default"
      gradientBackground
      gradientEdge={HOME_GRADIENT_EDGE}
      gradientPages={backgroundPages}
      gradientScrollY={HOME_GRADIENT_SCROLLS ? listScrollY : undefined}
    >
      <Animated.FlatList
        data={isReady ? feedPosts : []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={FeedSeparator}
        ListEmptyComponent={listEmptyComponent}
        ListFooterComponent={
          feedLoadingMore ? (
            <View style={styles.feedFooterLoading}>
              <Loader visible={true} overlayStyle={styles.loaderTransparent} />
            </View>
          ) : isReady && !feedError && feedPosts.length > 0 && !feedNextCursor ? (
            // The end of the feed, so an empty scroll below the last post
            // doesn't read as "still loading" or "broken".
            <View style={[styles.feedEnd, styles.inset]} testID="feed-end">
              <Text variant="caption" tone="secondary" align="center">
                {t('home.feedEnd')}
              </Text>
            </View>
          ) : null
        }
        onScroll={handleListScroll}
        scrollEventThrottle={16}
        onEndReached={loadMoreFeed}
        onEndReachedThreshold={0.4}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listContentStyle}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      />

      {isReady && showLogCoachMark && (
        <CoachMark
          message={t('home.logCoachMark')}
          onDismiss={dismissLogCoachMark}
          // Real bug, fixed 2026-09-24, per "I click it and nothing
          // displays and it goes away": the FAB (components/navigation/
          // bottomNavFab.tsx) fills almost the full BOTTOM_NAV_HEIGHT and
          // has its own `hitSlop={8}`, reaching 8px above the tab bar's own
          // top edge. This bubble's card padding pushed its actual touch
          // area close enough to that hitSlop zone that a tap could land on
          // the FAB underneath instead of the bubble (or vice versa) —
          // `spacing.md` (12px) of clearance wasn't enough of a margin.
          // `spacing.xl` (32px) leaves the FAB's hit zone with real room.
          style={[styles.logCoachMark, { bottom: insets.bottom + BOTTOM_NAV_HEIGHT + spacing.xl }]}
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  // No side padding on the list itself: photos and the two carousels run edge
  // to edge, and every other row insets itself by HOME_EDGE_INSET (below).
  listContent: {},
  inset: {
    paddingHorizontal: HOME_EDGE_INSET,
  },
  dividerInset: {
    marginHorizontal: HOME_EDGE_INSET,
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
  challengeArea: {},
  loaderTransparent: {
    backgroundColor: 'transparent',
  },
  center: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing['2xl'],
  },
  emptyStateCta: {
    marginTop: spacing.xs,
  },
  friendsArea: {},
  divider: {
    marginTop: spacing.xs,
  },
  feedEnd: {
    paddingVertical: spacing.xl,
  },
  feedFooterLoading: {
    height: 60,
  },
  // Shared with every scroll of posts (constants/feed.ts).
  separator: {
    height: FEED_POST_GAP,
  },
  // Anchored bottom-right, pointing down toward the tab bar's Log FAB — see
  // constants/bottomNav.ts's BOTTOM_NAV_HEIGHT for why the offset is
  // `insets.bottom + BOTTOM_NAV_HEIGHT` (the exact reserved height of the
  // floating glass tab bar), computed inline where insets is in scope.
  logCoachMark: {
    position: 'absolute',
    right: HOME_EDGE_INSET,
  },
});
