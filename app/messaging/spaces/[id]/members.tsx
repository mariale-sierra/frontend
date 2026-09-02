import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../../components/layout/screenBackground';
import { BackButton } from '../../../../components/ui/backButton';
import { Text } from '../../../../components/ui/text';
import { SearchBar } from '../../../../components/ui/searchBar';
import { Divider } from '../../../../components/ui/divider';
import { FollowListItem } from '../../../../components/profile/FollowListItem';
import { useSpaceMembers } from '../../../../hooks/useSpaceMembers';
import { colors, spacing } from '../../../../constants/theme';

const HEADER_SIDE_SIZE = 44;

/** Space participants — Sprint 8 Bloque 2's "4. PARTICIPANTES" requirement.
 * Reuses FollowListItem (same "avatar + username, taps through to their
 * profile" shape already reused for challenge members) instead of a second
 * near-identical row component. */
export default function SpaceMembersScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const spaceId = typeof id === 'string' && id.length > 0 ? id : null;
  const { members, loading, error } = useSpaceMembers(spaceId);
  const [query, setQuery] = useState('');

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((member) => member.username.toLowerCase().includes(q));
  }, [members, query]);

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton style={styles.headerSideButton} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('spaces.membersScreenTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.hero}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text variant="title">{members.length}</Text>
        )}
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('spaces.searchPlaceholder')}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text tone="secondary">{t('spaces.membersLoadError')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <FollowListItem user={item} />}
          ItemSeparatorComponent={() => <Divider marginVertical="xs" />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text tone="secondary">{t('spaces.membersEmpty')}</Text>
            </View>
          }
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerSideButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  headerSpacer: {
    width: HEADER_SIDE_SIZE,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
