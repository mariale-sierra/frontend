import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { Row } from '../../components/layout/row';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { ExploreCard, MineCard } from '../../components/challenge/list/challengeCards';
import { ChallengesViewToggle } from '../../components/challenge/list/ChallengesViewToggle';
import { ChallengesContentSkeleton } from '../../components/challenge/list/ChallengesContentSkeleton';
import { FinishedChallengesToggle } from '../../components/challenge/list/FinishedChallengesToggle';
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
import { useAuth } from '../../hooks/useAuth';

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
  const { view: requestedView } = useLocalSearchParams<{ view?: ChallengesView }>();

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
  const [mineChallenges, setMineChallenges] = useState<ChallengeMineCardViewModel[]>([]);
  const [exploreChallenges, setExploreChallenges] = useState<ExploreChallengeViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Finished challenges are collapsed out of the main Mine list by default —
  // see FinishedChallengesToggle's own doc comment.
  const [showFinished, setShowFinished] = useState(false);

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

  // Shared fetch used both by the focus-refetch effect below and by
  // pull-to-refresh — `isActive` mirrors the effect's own `active` closure
  // (defaults to "always active" for the pull-to-refresh caller, which only
  // ever runs while this screen is mounted and focused).
  const loadChallenges = useCallback(
    async (isActive: () => boolean = () => true) => {
      try {
        const [enrolledRaw, all, myPhotos] = await Promise.all([
          getMyChallenges(),
          getChallenges(),
          getMyProgressPhotos(),
        ]);
        if (!isActive()) return;
        const enrolled = enrolledRaw ?? [];
        const latestPhotoByChallengeId = groupLatestPhotoByChallengeId(myPhotos ?? []);
        const mineViewModels = toChallengeMineViewModels(enrolled, latestPhotoByChallengeId);
        // A finished challenge (`won`) stays in Mine, as its "Finished" card after the
        // ones still going — the card must not vanish when the celebration is closed.
        setMineChallenges(mineViewModels);

        for (const challenge of mineViewModels) {
          if (challenge.state === 'won' && !(await hasShownCompletion(challenge.challengeId))) {
            await markCompletionShown(challenge.challengeId);
            showChallengeFinished({
              challengeId: challenge.challengeId,
              challengeName: challenge.title,
              totalDays: challenge.totalDays,
            });
          }
          if (!isActive()) return;
        }

        // "You're in!" — a private challenge's owner can approve a pending
        // join request at any time, on their own device; this is the only
        // place the requester ever finds out. Only ever considers a
        // challenge the user didn't create themselves; a direct join or an
        // accepted invite already marks itself seen at its own success
        // point (see markChallengeMembershipSeen's other call sites), so it
        // never doubles up with this.
        if (userId) {
          const notCreatedByMe = mineViewModels.filter((c) => c.createdByUserId !== userId);
          if (!(await hasEstablishedMembershipBaseline())) {
            // First run ever on this device: every current membership is
            // pre-existing, not a new approval — record it silently, no popups.
            await establishMembershipBaseline(notCreatedByMe.map((c) => c.challengeId));
          } else {
            for (const challenge of notCreatedByMe) {
              if (!(await hasSeenChallengeMembership(challenge.challengeId))) {
                await markChallengeMembershipSeen(challenge.challengeId);
                showChallengeJoinApproved({ challengeId: challenge.challengeId, challengeName: challenge.title });
              }
              if (!isActive()) return;
            }
          }
        }

        // GET /challenges (getChallenges) returns every challenge, joined
        // or not — Explore is meant to be "what you could join," so any
        // challenge already in Mine (joined, or created — creating one
        // enrolls you immediately) has to be excluded here, same filter
        // app/(tabs)/search.tsx already does. Without this, a challenge
        // you're already in showed up in both tabs at once.
        const enrolledIds = new Set(enrolled.map((c) => String(c.id)));
        const explorable = (all ?? []).filter((c) => !enrolledIds.has(String(c.id)));
        setExploreChallenges(toExploreChallengeViewModels(explorable));
        setError(null);
      } catch (err) {
        if (!isActive()) return;
        const e = err as { response?: { status?: number; data?: unknown }; message?: string };
        console.error('[challenges] load failed:', e?.response?.status, e?.response?.data ?? e?.message ?? e);
        setError(t('challenges.loadError'));
      }
    },
    [t, showChallengeFinished, showChallengeJoinApproved, userId],
  );

  // Refetches on focus (not just on mount) so joining/leaving/completing a
  // challenge elsewhere and coming back here shows the current state.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      // No `setLoading(true)` here on purpose: this effect re-runs on every
      // re-focus (switching back to this tab), not just first mount. Doing
      // that flip unmounted the FlatList and swapped in
      // ChallengesContentSkeleton on every single visit — a full
      // render-everything-from-scratch every tab switch, even though the
      // previous list was still perfectly valid on screen. The initial
      // `useState(true)` above still covers the real first load; every
      // focus after that updates `mineChallenges`/`exploreChallenges` in
      // place, in the background, once the request resolves.
      loadChallenges(() => active).finally(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [loadChallenges]),
  );

  // Pull-to-refresh: same fetch as the focus effect above, minus the
  // `loading` flag flip — by the time the user can pull to refresh the
  // initial skeleton is long gone, RefreshControl's own spinner is enough.
  const { refreshing, onRefresh } = usePullToRefresh(useCallback(() => loadChallenges(), [loadChallenges]));

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
      </View>
    ),
    [handleCreateChallenge, t, view],
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
              <View style={styles.emptyState}>
                <Text variant="body" tone="secondary" align="center">
                  {t('challenges.emptyMine')}
                </Text>
              </View>
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
          data={exploreChallenges}
          keyExtractor={(item) => item.challengeId}
          renderItem={renderExploreItem}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={ChallengeListSeparator}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" tone="secondary" align="center">
                {t('challenges.emptyExplore')}
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
