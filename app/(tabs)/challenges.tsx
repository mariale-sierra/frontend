import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { ChallengeStatusCard } from '../../components/challenge/list/ChallengeStatusCard';
import { ExploreChallengeCard } from '../../components/challenge/list/ExploreChallengeCard';
import { ChallengesViewToggle } from '../../components/challenge/list/ChallengesViewToggle';
import { ChallengesContentSkeleton } from '../../components/challenge/list/ChallengesContentSkeleton';
import type { ChallengesView } from '../../components/challenge/list/ChallengesViewToggle';
import type { ExploreChallengeViewModel } from '../../components/challenge/list/challengeListSections';
import type { ChallengeMineCardViewModel } from '../../services/adapters/challengeListAdapter';
import { colors, radius, spacing } from '../../constants/theme';
import { getChallenges, getMyProgressPhotos } from '../../services/challenge/challenge.service';
import { getMyChallenges } from '../../services/user/user.service';
import { toChallengeMineViewModels, toExploreChallengeViewModels } from '../../services/adapters';
import { groupLatestPhotoByChallengeId } from '../../services/adapters/challengeState';
import { useChallengeCompletion } from '../../hooks/useConfirmationPopup';
import { storage } from '../../utils/storage';

// Persisted (not just in-memory) so a challenge that already showed its
// completion celebration doesn't show it again on every fresh app launch —
// a real bug: the old in-memory-only `useRef` Set reset on every cold start,
// so the SAME "you finished it!" popup re-appeared every day the user
// reopened the app, for every already-won challenge, forever. Fixed 2026-08-28.
const SHOWN_COMPLETIONS_KEY = 'shown_challenge_completions';

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

  // Celebration popup for a challenge that just flipped to `won` (the whole
  // challenge finished — see challengeState.ts's deriveChallengeCardState),
  // NOT the per-day `completed` state. Tracks which challengeIds have
  // already shown it — persisted to storage (SHOWN_COMPLETIONS_KEY above),
  // not just an in-memory Set, so it doesn't re-trigger on every fresh app
  // launch, only genuinely once per challenge ever.
  const completion = useChallengeCompletion();
  const { show: showCompletion } = completion;
  const shownCompletions = useRef(new Set<string>());
  const [shownCompletionsLoaded, setShownCompletionsLoaded] = useState(false);

  // Load the persisted "already shown" set once on mount, before the focus
  // effect below is allowed to show anything — otherwise the first focus
  // could show a popup for a challenge that was already celebrated in a
  // previous session, in the brief window before this resolves.
  useEffect(() => {
    let active = true;
    storage
      .getItem(SHOWN_COMPLETIONS_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        try {
          const ids = JSON.parse(raw);
          if (Array.isArray(ids)) shownCompletions.current = new Set(ids);
        } catch {
          // Corrupt/old value — treat as empty, not fatal.
        }
      })
      .finally(() => {
        if (active) setShownCompletionsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Refetches on focus (not just on mount) so joining/leaving/completing a
  // challenge elsewhere and coming back here shows the current state.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([getMyChallenges(), getChallenges(), getMyProgressPhotos()])
        .then(([enrolledRaw, all, myPhotos]) => {
          if (!active) return;
          const enrolled = enrolledRaw ?? [];
          const latestPhotoByChallengeId = groupLatestPhotoByChallengeId(myPhotos ?? []);
          const mineViewModels = toChallengeMineViewModels(enrolled, latestPhotoByChallengeId);
          setMineChallenges(mineViewModels);

          if (shownCompletionsLoaded) {
            for (const challenge of mineViewModels) {
              if (challenge.state === 'won' && !shownCompletions.current.has(challenge.challengeId)) {
                shownCompletions.current.add(challenge.challengeId);
                storage.setItem(SHOWN_COMPLETIONS_KEY, JSON.stringify(Array.from(shownCompletions.current)));
                showCompletion({
                  challengeId: challenge.challengeId,
                  challengeName: challenge.title,
                  totalDays: challenge.totalDays,
                });
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
        })
        .catch((err) => {
          console.error('[challenges] load failed:', err?.response?.status, err?.response?.data ?? err?.message ?? err);
          if (active) setError(t('challenges.loadError'));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [t, showCompletion, shownCompletionsLoaded]),
  );

  const handleCreateChallenge = () => router.push('/challenge/create');
  const handleOpenMineChallenge = (id: string) => router.push(`/challenge/${id}/progress`);
  const handleOpenExploreChallenge = (id: string) => router.push(`/challenge/${id}`);
  // Added 2026-08-29, per explicit request: the card's own "Add photo"
  // square shortcuts straight into logging THIS challenge's progress today,
  // instead of just opening its progress screen like the rest of the card.
  // useMetricsScreen.ts already reads `challengeId` off the route params
  // directly (the same way log.tsx's challenge-picker flow lands here), so
  // this is a normal push, not something that needs to go through that
  // picker first.
  const handleAddPhoto = (id: string) => router.push(`/(add)/metrics?challengeId=${id}`);

  const listHeader = (
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
  );

  if (loading) {
    return (
      <ScreenBackground variant="default">
        {listHeader}
        <View style={styles.skeletonWrap}>
          <ChallengesContentSkeleton />
        </View>
        <completion.Component />
      </ScreenBackground>
    );
  }

  if (error) {
    return (
      <ScreenBackground variant="default">
        {listHeader}
        <View style={styles.center}>
          <Text tone="secondary">{error}</Text>
        </View>
        <completion.Component />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground variant="default">
      {view === 'mine' ? (
        <FlatList
          data={mineChallenges}
          keyExtractor={(item) => item.challengeId}
          renderItem={({ item }) => (
            <View style={styles.itemWrap}>
              <ChallengeStatusCard
                challenge={item}
                onPress={() => handleOpenMineChallenge(item.challengeId)}
                onPressAddPhoto={() => handleAddPhoto(item.challengeId)}
              />
            </View>
          )}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" tone="secondary" align="center">
                {t('challenges.emptyMine')}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={exploreChallenges}
          keyExtractor={(item) => item.challengeId}
          renderItem={({ item }) => (
            <View style={styles.itemWrap}>
              <ExploreChallengeCard challenge={item} onPress={() => handleOpenExploreChallenge(item.challengeId)} />
            </View>
          )}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" tone="secondary" align="center">
                {t('challenges.emptyExplore')}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <completion.Component />
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
