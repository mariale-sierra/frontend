import { EmptyState } from '../../components/ui/emptyState';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { Row } from '../../components/layout/row';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { CoachMark } from '../../components/onboarding/CoachMark';
import { ExploreCard, MineCard } from '../../components/challenge/list/challengeCards';
import { ChallengesViewToggle } from '../../components/challenge/list/ChallengesViewToggle';
import { ChallengesContentSkeleton } from '../../components/challenge/list/ChallengesContentSkeleton';
import { FinishedChallengesToggle } from '../../components/challenge/list/FinishedChallengesToggle';
import { ACTIVITY_FILTER_ORDER, ActivityFilterChips } from '../../components/challenge/list/ActivityFilterChips';
import type { ActivityType } from '../../types/activity';
import type { ChallengesView } from '../../components/challenge/list/ChallengesViewToggle';
import type { ExploreChallengeViewModel } from '../../components/challenge/list/challengeListSections';
import type { ChallengeMineCardViewModel } from '../../services/adapters/challengeListAdapter';
import { colors, radius, spacing } from '../../constants/theme';
import { getChallenges, getMyProgressPhotos } from '../../services/challenge/challenge.service';
import { getMyChallenges } from '../../services/user/user.service';
import { toChallengeMineViewModels, toExploreChallengeViewModels } from '../../services/adapters';
import { groupLatestPhotoByChallengeId } from '../../services/adapters/challengeState';
import { useChallengeFinishedStore } from '../../store/challengeFinishedStore';
import { useChallengeJoinApprovedStore } from '../../store/challengeJoinApprovedStore';
import { hasShownCompletion, markCompletionShown } from '../../utils/shownCompletions';
import {
  establishMembershipBaseline,
  hasEstablishedMembershipBaseline,
  hasSeenChallengeMembership,
  markChallengeMembershipSeen,
} from '../../utils/seenChallengeMemberships';
import { hasSeenExploreTip, markExploreTipSeen } from '../../utils/exploreTip';
import { FORCE_SHOW_ONBOARDING_PREVIEWS } from '../../constants/onboardingDebug';
import { useAuth } from '../../hooks/useAuth';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { queryKeys, staleTimes } from '../../services/cache/queries';

function ChallengeListSeparator() {
  return <View style={styles.separator} />;
}

export default function Challenges() {
  const router = useRouter();
  const { t } = useTranslation();
  // Lets a caller land directly on the Explore segment (e.g. the Log
  // Metrics picker's "no challenges yet" empty state, which used to push a
  // separate app/challenge/explore-all.tsx screen — now retired in favor of
  // this same tab, deep-linked straight into its Explore view).
  // `activity`: open Browse already filtered to one activity (Search's "Browse by activity").
  const { view: requestedView, activity: requestedActivity } = useLocalSearchParams<{
    view?: ChallengesView;
    activity?: string;
  }>();

  const [view, setView] = useState<ChallengesView>(requestedView === 'explore' ? 'explore' : 'mine');

  // The `useState` initializer above only runs on this screen's very first
  // mount — a caller linking back here with an explicit `view` param (e.g.
  // Challenge-Info after a successful join, landing the user on Mine to see
  // their new challenge) needs this to also take effect when the tab screen
  // was ALREADY mounted underneath the screen that navigated away, which is
  // the normal case for a tab covered by a pushed stack screen. Only syncs
  // for an explicit `view` value — no param means "leave whatever the user
  // already had selected alone," same as before this existed.
  useEffect(() => {
    if (requestedView === 'mine' || requestedView === 'explore') {
      setView(requestedView);
    }
  }, [requestedView]);
  // Shared cache keys (same entries Home and Search read): switching tabs reuses
  // what is loaded; joining/leaving/logging invalidates exactly these.
  const enrolledQuery = useCachedQuery(queryKeys.myChallenges, getMyChallenges, {
    staleTime: staleTimes.activity,
    persist: true,
  });
  const photosQuery = useCachedQuery(queryKeys.myPhotos, getMyProgressPhotos, {
    staleTime: staleTimes.activity,
    persist: true,
  });
  // Every page of GET /challenges — only needed once Explore is opened.
  const allQuery = useCachedQuery(queryKeys.allChallenges, getChallenges, {
    staleTime: staleTimes.catalog,
    persist: true,
    enabled: view === 'explore',
  });

  const mineChallenges = useMemo<ChallengeMineCardViewModel[]>(
    () =>
      enrolledQuery.data
        ? toChallengeMineViewModels(enrolledQuery.data, groupLatestPhotoByChallengeId(photosQuery.data ?? []))
        : [],
    [enrolledQuery.data, photosQuery.data],
  );
  // GET /challenges returns every challenge, joined or not — Explore is "what
  // you could join", so anything already in Mine (joined, or created —
  // creating one enrolls you) is excluded, same filter as Search.
  const exploreChallenges = useMemo<ExploreChallengeViewModel[]>(() => {
    const enrolledIds = new Set((enrolledQuery.data ?? []).map((c) => String(c.id)));
    return toExploreChallengeViewModels((allQuery.data ?? []).filter((c) => !enrolledIds.has(String(c.id))));
  }, [enrolledQuery.data, allQuery.data]);
  // Browse's activity filter: challenges whose MAIN activity (the one that colors
  // their card) is this one; null for all. Every page of GET /challenges is already
  // loaded, so filtering here never misses a challenge.
  const [activityFilter, setActivityFilter] = useState<ActivityType | null>(null);
  const filterActivities = useMemo(
    () => ACTIVITY_FILTER_ORDER.filter((activity) =>
      exploreChallenges.some((challenge) => challenge.dominantActivityCategory === activity)),
    [exploreChallenges],
  );
  // Arriving with `activity=` (Search's chips): start filtered to it.
  useEffect(() => {
    const requested = ACTIVITY_FILTER_ORDER.find((activity) => activity === requestedActivity);
    if (requested) setActivityFilter(requested);
  }, [requestedActivity]);
  // A refresh can take away the last challenge of the picked activity — back to
  // all. Only once the list has loaded: an empty list mid-load isn't "no
  // challenges of that activity", and would wipe a filter Search just set.
  useEffect(() => {
    if (!allQuery.data) return;
    if (activityFilter && !filterActivities.includes(activityFilter)) setActivityFilter(null);
  }, [activityFilter, filterActivities, allQuery.data]);
  const visibleExploreChallenges = useMemo(
    () => (activityFilter
      ? exploreChallenges.filter((challenge) => challenge.dominantActivityCategory === activityFilter)
      : exploreChallenges),
    [exploreChallenges, activityFilter],
  );

  // A skeleton only while the current view has nothing to show yet; a failed
  // background refresh keeps the cached list instead of replacing it with an error.
  const loading =
    view === 'mine'
      ? enrolledQuery.isLoading || photosQuery.isLoading
      : enrolledQuery.isLoading || allQuery.isLoading;
  const failed = view === 'mine' ? !enrolledQuery.data && enrolledQuery.error : !allQuery.data && allQuery.error;
  const error = failed ? t('challenges.loadError') : null;
  // Finished challenges are collapsed out of the main Mine list by default —
  // see FinishedChallengesToggle's own doc comment.
  const [showFinished, setShowFinished] = useState(false);

  // Onboarding Stage 3's first-visit tip — shown on BOTH the Mine and
  // Explore segments (per explicit follow-up request; both share one "seen"
  // flag, not two, since it's the same one-time tip either way), once ever
  // per device (utils/exploreTip.ts), same shape as Stage 2's Home coach
  // mark. Loaded once on mount regardless of which segment is active first.
  const [showExploreTip, setShowExploreTip] = useState(false);
  useEffect(() => {
    if (FORCE_SHOW_ONBOARDING_PREVIEWS) {
      setShowExploreTip(true);
      return;
    }
    hasSeenExploreTip().then((seen) => {
      if (!seen) setShowExploreTip(true);
    });
  }, []);
  const dismissExploreTip = useCallback(() => {
    setShowExploreTip(false);
    markExploreTipSeen();
  }, []);

  // `mineChallenges` is already sorted active -> rest -> completed -> won
  // (toChallengeMineViewModels), so `finishedChallenges` stays in that same
  // relative order once revealed. `left` (abandoned) challenges never reach
  // this array at all — that adapter filters them out entirely (per explicit
  // request), so there's no separate "left stays inline" case to handle here.
  const activeMineChallenges = useMemo(() => mineChallenges.filter((c) => c.state !== 'won'), [mineChallenges]);
  const finishedMineChallenges = useMemo(() => mineChallenges.filter((c) => c.state === 'won'), [mineChallenges]);
  const mineListData = showFinished ? mineChallenges : activeMineChallenges;

  // The "Challenge complete" popup is global (`ChallengeFinishedPopup`, at the app
  // root) and normally shows the moment the last day is logged. This is the
  // fallback for a challenge that finished without this device seeing it (another
  // device, or an older build), so it is shown here once — `shownCompletions`
  // keeps it to once per challenge EVER, across launches and across the two places.
  const showChallengeFinished = useChallengeFinishedStore((state) => state.show);
  // Same idea for "You're in!": the only place a private challenge's owner
  // approving a join request can ever be discovered, since that happens
  // asynchronously on the OWNER's device — see utils/seenChallengeMemberships.ts.
  const showChallengeJoinApproved = useChallengeJoinApprovedStore((state) => state.show);
  const { userId } = useAuth();

  // One-time popups for what changed since this device last looked: run
  // whenever a new list of my challenges arrives (cache, focus or refresh).
  useEffect(() => {
    if (!enrolledQuery.data) return;
    let active = true;
    const mineViewModels = mineChallenges;
    (async () => {
      // The "Challenge complete" popup is normally shown the moment the last day
      // is logged; this is the fallback for a challenge that finished without
      // this device seeing it — once per challenge ever (`shownCompletions`).
      for (const challenge of mineViewModels) {
        if (!active) return;
        if (challenge.state === 'won' && !(await hasShownCompletion(challenge.challengeId))) {
          await markCompletionShown(challenge.challengeId);
          showChallengeFinished({
            challengeId: challenge.challengeId,
            challengeName: challenge.title,
            totalDays: challenge.totalDays,
          });
        }
      }

      // "You're in!" — a private challenge's owner can approve a pending join
      // request at any time, on their own device; this is the only place the
      // requester ever finds out. Only for challenges the user didn't create; a
      // direct join or an accepted invite already marks itself seen.
      if (!userId || !active) return;
      const notCreatedByMe = mineViewModels.filter((c) => c.createdByUserId !== userId);
      if (!(await hasEstablishedMembershipBaseline())) {
        // First run ever on this device: every current membership is
        // pre-existing, not a new approval — record it silently, no popups.
        await establishMembershipBaseline(notCreatedByMe.map((c) => c.challengeId));
        return;
      }
      for (const challenge of notCreatedByMe) {
        if (!active) return;
        if (!(await hasSeenChallengeMembership(challenge.challengeId))) {
          await markChallengeMembershipSeen(challenge.challengeId);
          showChallengeJoinApproved({ challengeId: challenge.challengeId, challengeName: challenge.title });
        }
      }
    })().catch(() => {});
    return () => {
      active = false;
    };
  }, [enrolledQuery.data, mineChallenges, showChallengeFinished, showChallengeJoinApproved, userId]);

  // Coming back to this tab asks the server only for what is stale.
  const revalidateEnrolled = enrolledQuery.revalidate;
  const revalidatePhotos = photosQuery.revalidate;
  const revalidateAll = allQuery.revalidate;
  useFocusEffect(
    useCallback(() => {
      void revalidateEnrolled();
      void revalidatePhotos();
      void revalidateAll();
    }, [revalidateEnrolled, revalidatePhotos, revalidateAll]),
  );

  const refetchEnrolled = enrolledQuery.refetch;
  const refetchPhotos = photosQuery.refetch;
  const refetchAll = allQuery.refetch;
  const { refreshing, onRefresh } = usePullToRefresh(
    useCallback(
      () => Promise.all([refetchEnrolled(), refetchPhotos(), view === 'explore' ? refetchAll() : undefined]),
      [refetchEnrolled, refetchPhotos, refetchAll, view],
    ),
  );

  // `useCallback` on all of these — they're read by the FlatLists'
  // `renderItem` below, so a stable reference here lets a stable per-item
  // renderItem avoid recreating closures (and re-rendering already-visible
  // rows) on every unrelated re-render of this screen.
  const handleCreateChallenge = useCallback(() => router.push('/challenge/create'), [router]);
  const handleOpenMineChallenge = useCallback((id: string) => router.push(`/challenge/${id}/progress`), [router]);
  const handleOpenExploreChallenge = useCallback((id: string) => router.push(`/challenge/${id}`), [router]);
  // Added 2026-08-29, per explicit request: the card's own "Add photo"
  // square shortcuts straight into logging THIS challenge's progress today,
  // instead of just opening its progress screen like the rest of the card.
  // useMetricsScreen.ts already reads `challengeId` off the route params
  // directly (the same way log.tsx's challenge-picker flow lands here), so
  // this is a normal push, not something that needs to go through that
  // picker first.
  const handleAddPhoto = useCallback((id: string) => router.push(`/(add)/metrics?challengeId=${id}`), [router]);

  const renderMineItem = useCallback(
    ({ item }: { item: ChallengeMineCardViewModel }) => (
      <View style={styles.itemWrap}>
        <MineCard
          challenge={item}
          onPress={() => handleOpenMineChallenge(item.challengeId)}
          onPressAddPhoto={() => handleAddPhoto(item.challengeId)}
        />
      </View>
    ),
    [handleOpenMineChallenge, handleAddPhoto],
  );

  const renderExploreItem = useCallback(
    ({ item }: { item: ExploreChallengeViewModel }) => (
      <View style={styles.itemWrap}>
        <ExploreCard challenge={item} onPress={() => handleOpenExploreChallenge(item.challengeId)} />
      </View>
    ),
    [handleOpenExploreChallenge],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
      <Row justify="space-between" align="center">
        <Text variant="title">{t('challenges.screenTitle')}</Text>
        {/* Bespoke pill, not the shared Button — this wireframe wants 14px
            bold text, and Button's `sm` size renders `caption` (12px,
            regular) internally with no way to override just the text style
            per call site. Changing that globally wasn't safe to do off the
            strength of one wireframe when Button's `sm` size is already used
            elsewhere without a confirmed spec. */}
        <Pressable
          onPress={handleCreateChallenge}
          style={({ pressed }) => [styles.newButton, pressed && styles.newButtonPressed]}
          accessibilityRole="button"
        >
          <Icon name="add-outline" size={16} color={colors.ink} />
          <Text variant="label" weight="bold" inverse>
            {t('challenges.newButton')}
          </Text>
        </Pressable>
      </Row>

      <ChallengesViewToggle
        view={view}
        onViewChange={setView}
        mineLabel={t('challenges.mineTab')}
        exploreLabel={t('challenges.exploreTab')}
      />

      {showExploreTip && (
        // `topRight` — points up at the toggle's "Explore" segment (the
        // second/right entry in ChallengesViewToggle's own segment order),
        // per explicit request.
        <CoachMark message={t('challenges.exploreTip')} onDismiss={dismissExploreTip} arrowPlacement="topRight" />
      )}

      {view === 'explore' && filterActivities.length > 0 && (
        <ActivityFilterChips activities={filterActivities} selected={activityFilter} onSelect={setActivityFilter} />
      )}
      </View>
    ),
    [handleCreateChallenge, t, view, showExploreTip, dismissExploreTip, filterActivities, activityFilter],
  );

  if (loading) {
    return (
      <ScreenBackground variant="default" gradientBackground>
        {listHeader}
        <View style={styles.skeletonWrap}>
          <ChallengesContentSkeleton />
        </View>
      </ScreenBackground>
    );
  }

  if (error) {
    return (
      <ScreenBackground variant="default" gradientBackground>
        {listHeader}
        <View style={styles.center}>
          <Text tone="secondary">{error}</Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground variant="default" gradientBackground>
      {view === 'mine' ? (
        <FlatList
          data={mineListData}
          keyExtractor={(item) => item.challengeId}
          renderItem={renderMineItem}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={ChallengeListSeparator}
          // Only the TRUE empty state (no challenges at all) shows this —
          // `mineListData` can be empty just because every challenge is
          // finished and still collapsed, which isn't "no challenges."
          ListEmptyComponent={
            mineChallenges.length === 0 ? (
              <EmptyState
                icon="trophy-outline"
                title={t('challenges.emptyMineTitle')}
                message={t('challenges.emptyMine')}
                actions={[
                  { label: t('challenges.emptyMineExplore'), onPress: () => setView('explore'), testID: 'empty-mine-explore' },
                  { label: t('challenges.emptyMineCreate'), onPress: () => router.push('/challenge/create'), testID: 'empty-mine-create' },
                ]}
              />
            ) : undefined
          }
          ListFooterComponent={
            finishedMineChallenges.length > 0 ? (
              <View style={styles.itemWrap}>
                <FinishedChallengesToggle
                  count={finishedMineChallenges.length}
                  expanded={showFinished}
                  onToggle={() => setShowFinished((current) => !current)}
                />
              </View>
            ) : undefined
          }
          contentContainerStyle={styles.listContent}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={5}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
      ) : (
        <FlatList
          data={visibleExploreChallenges}
          keyExtractor={(item) => item.challengeId}
          renderItem={renderExploreItem}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={ChallengeListSeparator}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" tone="secondary" align="center">
                {activityFilter ? t('challenges.emptyExploreFilter') : t('challenges.emptyExplore')}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={5}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.big,
    backgroundColor: colors.primary,
  },
  newButtonPressed: {
    opacity: 0.9,
  },
  // CoachMark's own default wrapper is sized/aligned for a floating bubble
  // pointing at something (maxWidth 260, right-aligned) — an inline
  // first-visit tip sitting in the list header wants the opposite: full
  // width, no cap. Both keys are explicitly overridden here (an RN style
  // array only overrides keys the later object actually sets).
  // Real, fixed padding of its own now, not relying on also being nested
  // inside listContent's own paddingHorizontal to reach its final inset
  // (that stacking only actually happened once the FlatList took over
  // rendering it, causing a visible jump — see itemWrap below). `lg` (24) —
  // the app-wide screen-margin default (see design system → Screen edge
  // margin) — matches Home's own single, uniform edge padding.
  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  // No paddingHorizontal here anymore — each item wraps itself (see
  // itemWrap) so the list's own edge inset can't stack with listHeader's.
  listContent: {
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  itemWrap: {
    paddingHorizontal: spacing.lg,
  },
  skeletonWrap: {
    paddingHorizontal: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
});
