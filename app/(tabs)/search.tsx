import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { Text } from '../../components/ui/text';
import { SearchBar } from '../../components/ui/searchBar';
import { ExploreChallengeCard } from '../../components/challenge/list/ExploreChallengeCard';
import { SearchUserRow } from '../../components/search';
import { getChallenges } from '../../services/challenge/challenge.service';
import { getMyChallenges, searchUsers } from '../../services/user/user.service';
import { toExploreChallengeViewModels } from '../../services/adapters/challengeListAdapter';
import type { ExploreChallengeViewModel } from '../../components/challenge/list/challengeListSections';
import type { PublicProfileContract } from '../../types/user';
import { colors, spacing } from '../../constants/theme';

const SEARCH_DEBOUNCE_MS = 300;

export default function Search() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

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
    Promise.all([getChallenges(), getMyChallenges()])
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

  const hasQuery = debouncedQuery.length > 0;
  const isSearching = catalogLoading || peopleLoading;
  const hasNoResults = hasQuery && !isSearching && matchedChallenges.length === 0 && people.length === 0;

  return (
    <ScreenBackground variant="default" applyTopInset={false} contentStyle={{ paddingTop: Math.max(insets.top, 0) }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing['2xl'] }}>
        <View style={styles.titleWrap}>
          <Text variant="title">{t('search.screenTitle')}</Text>
        </View>

        <View style={styles.searchBarWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder={t('search.placeholder')} />
        </View>

        {!hasQuery ? (
          <View style={styles.center}>
            <Text tone="secondary" align="center">{t('search.emptyPrompt')}</Text>
          </View>
        ) : catalogLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : hasNoResults ? (
          <View style={styles.center}>
            <Text tone="secondary" align="center">{t('search.emptyResults', { query: debouncedQuery })}</Text>
          </View>
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
                  {matchedChallenges.map((challenge) => (
                    <ExploreChallengeCard
                      key={challenge.challengeId}
                      challenge={challenge}
                      onPress={() => router.push(`/challenge/${challenge.challengeId}`)}
                    />
                  ))}
                </View>
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
  peopleList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  peopleLoading: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
