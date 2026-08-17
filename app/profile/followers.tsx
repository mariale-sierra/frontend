import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Divider } from '../../components/ui/divider';
import { FollowUserRow } from '../../components/follows/FollowUserRow';
import { useFollows } from '../../hooks/useFollows';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';
import { colors, spacing } from '../../constants/theme';
import type { FollowUserSummaryContract } from '../../types/follow';

type FollowsTab = 'followers' | 'following';

/**
 * Followers / following screen. Both tabs come from GET /follows/*; the
 * follow pill on every row is driven by the same `following` list, so a
 * follow-back from the Followers tab flips the button instantly once the
 * lists reload.
 */
export default function Followers() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<FollowsTab>(params.tab === 'following' ? 'following' : 'followers');
  const {
    followers,
    following,
    loading,
    refreshing,
    error,
    processingId,
    isFollowing,
    toggleFollow,
    refresh,
    reload,
  } = useFollows();
  const { show } = useErrorNotificationStore();

  const data = tab === 'followers' ? followers : following;

  const handleToggle = async (user: FollowUserSummaryContract) => {
    const ok = await toggleFollow(user);
    if (!ok) show({ message: t('follows.errorAction') });
  };

  return (
    <ScreenBackground variant="default">
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton />
          <Text variant="title">{t('follows.screenTitle')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.tabs}>
          <Button
            variant={tab === 'followers' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setTab('followers')}
            style={styles.tabButton}
          >
            {t('follows.followersTab')}
          </Button>
          <Button
            variant={tab === 'following' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setTab('following')}
            style={styles.tabButton}
          >
            {t('follows.followingTab')}
          </Button>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text tone="secondary">{t('follows.loadError')}</Text>
            <Button variant="outline" size="sm" onPress={reload}>
              {t('common.actions.continue')}
            </Button>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
            }
          >
            {data.length === 0 ? (
              <View style={styles.center}>
                <Text tone="secondary">
                  {tab === 'followers' ? t('follows.emptyFollowers') : t('follows.emptyFollowing')}
                </Text>
              </View>
            ) : (
              data.map((user, index) => (
                <View key={user.id}>
                  {index > 0 && <Divider marginVertical="md" />}
                  <FollowUserRow
                    user={user}
                    isFollowing={isFollowing(user.id)}
                    busy={processingId !== null}
                    processing={processingId === user.id}
                    onToggle={handleToggle}
                  />
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
  },
  list: {
    paddingBottom: spacing['2xl'],
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
