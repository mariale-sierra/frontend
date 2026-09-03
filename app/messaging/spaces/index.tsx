import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../components/layout/screenBackground';
import { BackButton } from '../../../components/ui/backButton';
import { IconButton } from '../../../components/ui/iconButton';
import { Text } from '../../../components/ui/text';
import { Button } from '../../../components/ui/button';
import { SearchBar } from '../../../components/ui/searchBar';
import { Row } from '../../../components/layout/row';
import { SpaceCard } from '../../../components/spaces/SpaceCard';
import { SpaceCardSkeleton } from '../../../components/spaces/SpaceCardSkeleton';
import { useSpaces } from '../../../hooks/useSpaces';
import { joinSpace } from '../../../services/spaces/spaces.service';
import { colors, spacing } from '../../../constants/theme';
import type { SpaceContract } from '../../../types/space';

/** Spaces discovery screen — the full list behind the "See all" link on the
 * Spaces section of messaging/index.tsx (wireframe Chats-46A's "Spaces &
 * Messages" screen shows this section directly; a dedicated full-list
 * screen with search is this app's usual pattern for "more than a preview"
 * lists, same as Home's Streaks-All or a challenge's Members list).
 *
 * Same "explore, not manage" scope as that preview section: a space the
 * viewer has already joined (or owns) doesn't belong here — it's a
 * conversation now, living in Messages instead — so it's filtered out here
 * too, not just in the preview. */
export default function SpacesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { spaces, loading, error, reload } = useSpaces();
  const [query, setQuery] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const exploreSpaces = useMemo(() => spaces.filter((space) => !space.isMember), [spaces]);

  const filteredSpaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exploreSpaces;
    return exploreSpaces.filter((space) => space.name.toLowerCase().includes(q));
  }, [exploreSpaces, query]);

  async function handleJoin(space: SpaceContract) {
    setJoiningId(space.id);
    try {
      await joinSpace(space.id);
      reload();
    } catch {
      // Global api.ts interceptor already surfaces an error toast.
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <ScreenBackground variant="default">
      <Row align="center" gap="sm" style={styles.header}>
        <BackButton style={styles.backButton} />
        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder={t('spaces.searchPlaceholder')} />
        </View>
        <IconButton
          name="add-outline"
          size={48}
          iconSize={24}
          iconColor={colors.ink}
          style={styles.createButton}
          onPress={() => router.push('/messaging/spaces/create')}
          accessibilityLabel={t('spaces.composeA11y')}
        />
      </Row>

      {loading ? (
        <View style={styles.skeletonList}>
          {Array.from({ length: 4 }, (_, index) => (
            <SpaceCardSkeleton key={index} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text tone="secondary">{t('spaces.loadError')}</Text>
          <Button variant="outline" size="sm" onPress={reload}>
            {t('common.actions.continue')}
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredSpaces}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SpaceCard
              space={item}
              onPress={() => router.push(`/messaging/spaces/${item.id}`)}
              onPressCta={() => handleJoin(item)}
              ctaLoading={joiningId === item.id}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text tone="secondary">
                {query.trim() ? t('spaces.noResultsForSearch') : t('spaces.emptyState')}
              </Text>
            </View>
          }
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  searchWrap: {
    flex: 1,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  skeletonList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  separator: {
    height: spacing.sm,
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
