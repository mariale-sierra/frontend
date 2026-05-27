import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ScreenBackground from '../../components/layout/screenBackground';
import { Text } from '../../components/ui/text';
import { SearchBar } from '../../components/ui/searchBar';
import { ExploreChallengeCard } from '../../components/challenge/list/ExploreChallengeCard';
import { getChallenges } from '../../services/challenge/challenge.service';
import { getMyChallenges } from '../../services/user/user.service';
import { toExploreChallengeViewModels } from '../../services/adapters/challengeListAdapter';
import { buildMockExploreChallenges } from '../../services/mocks/exploreMock';
import type { ExploreChallengeViewModel } from '../../components/challenge/list/challengeListSections';
import { colors, spacing } from '../../constants/theme';

export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [available, setAvailable] = useState<ExploreChallengeViewModel[]>([]);

  useEffect(() => {
    Promise.all([getChallenges(), getMyChallenges()])
      .then(([allChallenges, myChallenges]) => {
        const joinedIds = new Set(myChallenges.map((c) => String(c.id)));
        const unjoined = allChallenges.filter((c) => !joinedIds.has(String(c.id)));
        setAvailable([...buildMockExploreChallenges(), ...toExploreChallengeViewModels(unjoined)]);
      })
      .catch(() => setError('Could not load challenges.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return available;
    return available.filter((c) => c.title.toLowerCase().includes(lower));
  }, [available, query]);

  return (
    <ScreenBackground variant="default">
      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.challengeId}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.xs }]}
        ListHeaderComponent={
          <View style={styles.searchBarWrapper}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search challenges"
            />
          </View>
        }
        renderItem={({ item }) => (
          <ExploreChallengeCard
            challenge={item}
            onPress={() => router.push(`/challenge/${item.challengeId}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.textPrimary} />
            </View>
          ) : (
            <Text tone="secondary">{error ?? 'No challenges available.'}</Text>
          )
        }
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  searchBarWrapper: {
    marginBottom: spacing.xl,
  },
  separator: {
    height: spacing.sm,
  },
  center: {
    paddingTop: spacing['2xl'],
    alignItems: 'center',
  },
});
