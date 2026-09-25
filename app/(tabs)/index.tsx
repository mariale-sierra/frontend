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
import { getHomeFeed } from '../../services/feed/feed.service';
import { toFeedPostViewModels } from '../../services/adapters/feedAdapter';
import type { FeedPostViewModel } from '../../services/adapters/feedAdapter';
import { getFollowingStreaks } from '../../services/follow/follow.service';
import { toFriendStreakViewModels } from '../../services/adapters/followAdapter';
import { colors, spacing, textOpacity } from '../../constants/theme';
import { HOME_GRADIENT_EDGE, HOME_GRADIENT_SCROLLS, USE_HOME_ACTIVITY_GRADIENT } from '../../constants/screenBackground';
import { BOTTOM_NAV_HEIGHT } from '../../constants/bottomNav';
import { FORCE_SHOW_ONBOARDING_PREVIEWS } from '../../constants/onboardingDebug';
import { formatTodayLabel, hoursUntilMidnight } from '../../utils/time';
import { withAlpha } from '../../utils/color';
import { hasSeenLogCoachMark, markLogCoachMarkSeen } from '../../utils/logCoachMark';

function FeedSeparator() {
  return <View style={styles.separator} />;
}

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

  const [feedPosts, setFeedPosts] = useState<FeedPostViewModel[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
  const [feedNextCursor, setFeedNextCursor] = useState<string | undefined>(undefined);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);

  const [friendStreaks, setFriendStreaks] = useState<FriendStreakViewModel[]>([]);
  const [friendStreaksLoading, setFriendStreaksLoading] = useState(true);
  const [friendStreaksError, setFriendStreaksError] = useState(false);

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
      // No `setFeedLoading(true)` here on purpose: this effect also fires on
      // every re-focus (tab switch back to Home), not just first mount. Doing
      // that flip forced `isReady` back to false on every visit, swapping the
      // whole header + feed out for HomeContentSkeleton and emptying the
      // FlatList's data even though we already had a perfectly good list on
      // screen — the exact "re-renders everything from scratch" heaviness
      // reported when switching tabs. The initial `useState(true)` above
      // still covers the real first load; every focus after that refreshes
      // `feedPosts` silently in place once the request resolves.
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
      // Same reasoning as the feed effect above — no loading-flag reset on
      // every re-focus, only the real first load (initial `useState(true)`).
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

  // Pull-to-refresh: re-fetches all three sections at once, independently of
  // each other (one failing doesn't block the other two from updating) —
  // same per-section error flags the focus effects above already maintain.
  // Doesn't touch `challengeLoading`/`feedLoading`/`friendStreaksLoading` on
  // purpose: those gate the full-screen skeleton (see `isReady` below), and
  // by the time the user can pull to refresh that skeleton is long gone —
  // RefreshControl's own spinner is the only loading indicator this needs.
  const refreshHome = useCallback(async () => {
    const [challengesResult, feedResult, streaksResult] = await Promise.allSettled([
      Promise.all([getMyChallenges(), getMyProgressPhotos()]),
      getHomeFeed(),
      getFollowingStreaks(),
    ]);

    if (challengesResult.status === 'fulfilled') {
      const [data, myPhotos] = challengesResult.value;
      const latestPhotoByChallengeId = groupLatestPhotoByChallengeId(myPhotos ?? []);
      setChallenges(getHomeChallengesSorted(data ?? [], latestPhotoByChallengeId));
    }

    if (feedResult.status === 'fulfilled') {
      setFeedPosts(toFeedPostViewModels(feedResult.value.posts));
      setFeedNextCursor(feedResult.value.nextCursor);
      setFeedError(false);
    } else {
      setFeedError(true);
    }

    if (streaksResult.status === 'fulfilled') {
      setFriendStreaks(toFriendStreakViewModels(streaksResult.value));
      setFriendStreaksError(false);
    } else {
      setFriendStreaksError(true);
    }
  }, []);
  const { refreshing, onRefresh } = usePullToRefresh(refreshHome);

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

  // `useCallback` (not a plain function declaration) so FlatList sees a
  // stable `renderItem` reference across re-renders — a new function
  // identity every render defeats FlatList's own cell-level memoization and
  // forces every visible row to re-render even when its own data hasn't
  // changed (e.g. while the friend-streaks section resolves independently).
  const renderItem = useCallback(({ item }: { item: FeedPostViewModel }) => <FeedPostCard post={item} />, []);

  // One combined gate instead of three independent loading flags each
  // rendering their own fallback — the screen reveals once, fully populated,
  // instead of the hero card / streaks / feed popping in separately as each
  // fetch happens to resolve. See HomeContentSkeleton.
  const isReady = !challengeLoading && !feedLoading && !friendStreaksLoading;

  const listHeader = useMemo(
    () => (
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

      {!isReady ? (
        <HomeContentSkeleton />
      ) : (
        <>
          <View style={styles.challengeArea}>
            {challenges.length > 0 ? (
              <ActiveChallengeSection challenges={challenges} hoursLeft={hoursLeft} scrollX={carouselScrollX} />
            ) : (
              <View style={styles.center}>
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

          <Divider style={styles.divider} />
        </>
      )}
      </View>
    ),
    [carouselScrollX, challenges, friendStreaks, friendStreaksError, hoursLeft, isReady, router, t, username],
  );
  const listEmptyComponent = useMemo(
    () => (!isReady ? null : feedError ? <FeedErrorState /> : <EmptyFeed />),
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
  feedFooterLoading: {
    height: 60,
  },
  separator: {
    height: spacing['2xl'],
  },
  // Anchored bottom-right, pointing down toward the tab bar's Log FAB — see
  // constants/bottomNav.ts's BOTTOM_NAV_HEIGHT for why the offset is
  // `insets.bottom + BOTTOM_NAV_HEIGHT` (the exact reserved height of the
  // floating glass tab bar), computed inline where insets is in scope.
  logCoachMark: {
    position: 'absolute',
    right: spacing.lg,
  },
});
