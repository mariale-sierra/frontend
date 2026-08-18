import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../layout/screenBackground';
import { BackButton } from '../ui/backButton';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { Divider } from '../ui/divider';
import { FollowListItem } from './FollowListItem';
import { getFollowers, getFollowing } from '../../services/follow/follow.service';
import { colors, spacing } from '../../constants/theme';
import type { FollowUserSummaryContract } from '../../types/follow';

interface FollowListScreenProps {
  kind: 'followers' | 'following';
}

/** Shared screen for GET /follows/followers and GET /follows/following —
 * only the authenticated caller's own lists (the backend has no endpoint
 * for another user's followers/following). */
export function FollowListScreen({ kind }: FollowListScreenProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<FollowUserSummaryContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const request = kind === 'followers' ? getFollowers() : getFollowing();
    request
      .then(setUsers)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [kind]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const title = kind === 'followers' ? t('profile.followersScreenTitle') : t('profile.followingScreenTitle');
  const emptyLabel = kind === 'followers' ? t('profile.emptyFollowers') : t('profile.emptyFollowing');
  const errorLabel = kind === 'followers' ? t('profile.followersLoadError') : t('profile.followingLoadError');

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
        <Text variant="title">{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text tone="secondary">{errorLabel}</Text>
          <Button variant="outline" size="sm" onPress={load}>
            {t('common.actions.continue')}
          </Button>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <FollowListItem user={item} />}
          ItemSeparatorComponent={() => <Divider marginVertical="xs" />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text tone="secondary">{emptyLabel}</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerSpacer: {
    width: 40,
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
