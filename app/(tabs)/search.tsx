import { EmptyState } from '../../components/ui/emptyState';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { Text } from '../../components/ui/text';
import { SearchBar } from '../../components/ui/searchBar';
import { ExploreCard } from '../../components/challenge/list/challengeCards';
import { SearchUserRow } from '../../components/search';
import { ACTIVITY_FILTER_ORDER, ActivityFilterChips } from '../../components/challenge/list/ActivityFilterChips';
import { searchUsers } from '../../services/user/user.service';
import { loadMyChallenges } from '../../services/cache/loaders';
import { loadAllChallenges } from '../../services/cache/challengeLoaders';
import { toExploreChallengeViewModels } from '../../services/adapters/challengeListAdapter';
import type { ExploreChallengeViewModel } from '../../components/challenge/list/challengeListSections';
import type { PublicProfileContract } from '../../types/user';
import { colors, spacing } from '../../constants/theme';

const SEARCH_DEBOUNCE_MS = 300;

// Capped, per explicit request: an unbounded challenge-results list pushed
// the People section endlessly far down the screen for a broad query. Same
// "preview + See more/See less" pattern the old Invitations screen
// established for its own capped request list (`REQUESTS_PREVIEW_COUNT`).
const CHALLENGE_RESULTS_PREVIEW_COUNT = 3;
// Before typing: how many of the most joined challenges to suggest.
const POPULAR_COUNT = 3;

export default function Search() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [challengesExpanded, setChallengesExpanded] = useState(false);

  // Full challenge catalog, fetched once — matching is a client-side title
  // filter, same as before this pass. There's no backend full-text search
  // for challenges yet; fine at today's catalog size, worth a real backend
  // endpoint if that ever changes.
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [availableChallenges, setAvailableChallenges] = useState<ExploreChallengeViewModel[]>([]);

  // People search IS a real backend query (GET /users/search) — re-run per
  // debounced query, not filtered client-side.
  const [people, setPeople] = useState<PublicProfileContract[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let active = true;
    Promise.all([loadAllChallenges(), loadMyChallenges()])
      .then(([all, mine]) => {
        if (!active) return;
        const joinedIds = new Set(mine.map((c) => String(c.id)));
        setAvailableChallenges(toExploreChallengeViewModels(all.filter((c) => !joinedIds.has(String(c.id)))));
      })
      .catch(() => {
        if (active) setAvailableChallenges([]);
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      setPeople([]);
      return;
    }
    let active = true;
    setPeopleLoading(true);
    searchUsers(debouncedQuery)
      .then((results) => {
        if (active) setPeople(results);
      })
      .catch(() => {
        if (active) setPeople([]);
      })
      .finally(() => {
        if (active) setPeopleLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const matchedChallenges = useMemo(() => {
    if (!debouncedQuery) return [];
    const lower = debouncedQuery.toLowerCase();
    return availableChallenges.filter((c) => c.title.toLowerCase().includes(lower));
  }, [availableChallenges, debouncedQuery]);

  // A new query shouldn't inherit the previous one's expanded state.
  useEffect(() => {
    setChallengesExpanded(false);
  }, [debouncedQuery]);

  const visibleChallenges = challengesExpanded
    ? matchedChallenges
    : matchedChallenges.slice(0, CHALLENGE_RESULTS_PREVIEW_COUNT);

  // Before typing: what's worth a look (2026-10-23, in place of a lone icon
  // and label) — the activities there are challenges for, and the most joined
  // challenges (the catalog already comes sorted by members).
  const browseActivities = useMemo(
    () => ACTIVITY_FILTER_ORDER.filter((activity) =>
      availableChallenges.some((challenge) => challenge.dominantActivityCategory === activity)),
    [availableChallenges],
  );
  const popularChallenges = availableChallenges.slice(0, POPULAR_COUNT);
  const hasSuggestions = browseActivities.length > 0 || popularChallenges.length > 0;

  const hasQuery = debouncedQuery.length > 0;
  const isSearching = catalogLoading || peopleLoading;
  const hasNoResults = hasQuery && !isSearching && matchedChallenges.length === 0 && people.length === 0;

  return (
    <ScreenBackground variant="default" gradientBackground applyTopInset={false} contentStyle={{ paddingTop: Math.max(insets.top, 0) }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing['2xl'] }}>
        <View style={styles.titleWrap}>
          <Text variant="title" align="center">{t('search.screenTitle')}</Text>
        </View>

        <View style={styles.searchBarWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder={t('search.placeholder')} />
        </View>

        {!hasQuery && hasSuggestions ? (
          <>
            {browseActivities.length > 0 && (
              <View style={styles.section} testID="search-browse-activities">
                <View style={styles.sectionHeader}>
                  <Text variant="subheader">{t('search.browseByActivity')}</Text>
                </View>
                <View style={styles.chipsWrap}>
                  <ActivityFilterChips
                    activities={browseActivities}
                    selected={null}
                    showAll={false}
                    onSelect={(activity) =>
                      activity && router.push(`/(tabs)/challenges?view=explore&activity=${activity}`)}
                  />
                </View>
              </View>
            )}

            {popularChallenges.length > 0 && (
              <View style={styles.section} testID="search-popular">
                <Row justify="space-between" align="center" style={styles.sectionHeader}>
                  <Text variant="subheader">{t('search.popularTitle')}</Text>
                  <Pressable
                    onPress={() => router.push('/(tabs)/challenges?view=explore')}
                    hitSlop={8}
                    accessibilityRole="button"
                    testID="search-popular-see-all"
                  >
                    <Text variant="label" weight="bold" style={styles.seeAll}>
                      {t('search.seeAll')}
                    </Text>
                  </Pressable>
                </Row>
                <View style={styles.challengeList}>
                  {popularChallenges.map((challenge) => (
                    <ExploreCard
                      key={challenge.challengeId}
                      challenge={challenge}
                      onPress={() => router.push(`/challenge/${challenge.challengeId}`)}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        ) : !hasQuery ? (
          // Nothing to suggest (still loading, or no challenges at all).
          <EmptyState
            icon="search-outline"
            title={t('search.emptyPromptTitle')}
            // The title in the search icon's own muted tone (2026-10-20).
            muted
          />
        ) : catalogLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : hasNoResults ? (
          <EmptyState
            icon="sad-outline"
            title={t('search.emptyResults', { query: debouncedQuery })}
            message={t('search.emptyResultsHint')}
          />
        ) : (
          <>
            {matchedChallenges.length > 0 && (
              <View style={styles.section}>
                <Row justify="space-between" align="center" style={styles.sectionHeader}>
                  <Text variant="subheader">{t('search.challengesSectionTitle')}</Text>
                  <Text variant="label" weight="bold" tone="secondary">
                    {t('search.resultsCount', { count: matchedChallenges.length })}
                  </Text>
                </Row>
                <View style={styles.challengeList}>
                  {visibleChallenges.map((challenge) => (
                    <ExploreCard
                      key={challenge.challengeId}
                      challenge={challenge}
                      onPress={() => router.push(`/challenge/${challenge.challengeId}`)}
                    />
                  ))}
                </View>

                {matchedChallenges.length > CHALLENGE_RESULTS_PREVIEW_COUNT && (
                  <Pressable
                    onPress={() => setChallengesExpanded((v) => !v)}
                    hitSlop={8}
                    style={styles.seeMore}
                  >
                    <Text variant="body" tone="secondary">
                      {challengesExpanded ? t('search.seeLessChallenges') : t('search.seeMoreChallenges')}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {(people.length > 0 || peopleLoading) && (
              <View style={styles.section}>
                <Row justify="space-between" align="center" style={styles.sectionHeader}>
                  <Text variant="subheader">{t('search.peopleSectionTitle')}</Text>
                  {!peopleLoading && (
                    <Text variant="label" weight="bold" tone="secondary">
                      {t('search.resultsCount', { count: people.length })}
                    </Text>
                  )}
                </Row>
                {peopleLoading ? (
                  <View style={styles.peopleLoading}>
                    <ActivityIndicator color={colors.primary} />
                  </View>
                ) : (
                  <View style={styles.peopleList}>
                    {people.map((user) => (
                      <SearchUserRow key={user.id} user={user} />
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

// `lg` (24) everywhere on this screen — the app-wide screen-margin default
// (see design system → Screen edge margin), the same single value Home uses
// for every one of its elements. Was a `base`(16)/`xl`(32) split between the
// title/search bar and the result lists — visually inconsistent within the
// screen itself, fixed by using the one value throughout instead.
const styles = StyleSheet.create({
  titleWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  searchBarWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  center: {
    paddingTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  section: {
    paddingBottom: spacing.lg,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  challengeList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  // The chips scroll out to the screen's edges: they bleed out of this padding.
  chipsWrap: {
    paddingHorizontal: spacing.lg,
  },
  seeAll: {
    color: colors.primary,
    opacity: 1,
  },
  seeMore: {
    alignSelf: 'center',
    paddingTop: spacing.md,
  },
  peopleList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  peopleLoading: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
