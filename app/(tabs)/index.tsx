import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import ScreenBackground from '../../components/layout/screenBackground';
import { Icon } from '../../components/ui/icon';
import { Loader } from '../../components/ui/loader';
import { Text } from '../../components/ui/text';
import { UserAvatar } from '../../components/ui/userAvatar';
import { ActiveChallengeSection } from '../../components/home/ActiveChallengeSection';
import { FeedPostCard } from '../../components/home/FeedPostCard';
import type { HomeActiveChallengeViewModel } from '../../services/adapters/homeAdapter';
import { getHomeChallengesSorted } from '../../services/adapters/homeAdapter';
import { getMyChallenges } from '../../services/user/user.service';
import { getHomeFeed } from '../../services/feed/feed.service';
import { toFeedPostViewModels } from '../../services/adapters/feedAdapter';
import type { FeedPostViewModel } from '../../services/adapters/feedAdapter';
// REMOVE_MOCK_START
import { buildMockFeedPosts } from '../../services/mocks/feedMock';
// REMOVE_MOCK_END
import { spacing } from '../../constants/theme';
import { hoursUntilMidnight } from '../../utils/time';

export default function Home() {
  const { username } = useAuth();
  const insets = useSafeAreaInsets();

  // Same source as the Challenges tab (services/user/user.service.ts getMyChallenges,
  // i.e. GET /users/me/challenges) so the two screens always show the same set of
  // challenges — this used to mix hardcoded mock badges with a single, separately
  // fetched "current" challenge from /challenges/progress.
  const [challenges, setChallenges] = useState<HomeActiveChallengeViewModel[]>([]);
  const [challengeLoading, setChallengeLoading] = useState(true);

  const [feedPosts, setFeedPosts] = useState<FeedPostViewModel[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  const hoursLeft = hoursUntilMidnight();

  useEffect(() => {
    getMyChallenges()
      .then((data) => setChallenges(getHomeChallengesSorted(data)))
      .catch(() => setChallenges([]))
      .finally(() => setChallengeLoading(false));
  }, []);

  useEffect(() => {
    getHomeFeed()
      .then((data) => setFeedPosts(toFeedPostViewModels(data)))
      .catch(() => {
        // REMOVE_MOCK: remove fallback once /feed is live
        setFeedPosts(toFeedPostViewModels(buildMockFeedPosts()));
      })
      .finally(() => setFeedLoading(false));
  }, []);

  function renderItem({ item }: { item: FeedPostViewModel }) {
    return <FeedPostCard post={item} />;
  }

  const listHeader = (
    <View style={[styles.listHeader, { paddingTop: insets.top + spacing.xs }]}>
      <View style={styles.profileRow}>
        <UserAvatar username={username ?? ''} size={44} />
        <Text variant="body" style={styles.username}>
          {username ?? ''}
        </Text>
      </View>

      <View style={styles.challengeArea}>
        {challengeLoading ? (
          <View style={styles.challengeLoadingArea}>
            <Loader visible={true} overlayStyle={styles.loaderTransparent} />
          </View>
        ) : challenges.length > 0 ? (
          <ActiveChallengeSection challenges={challenges} hoursLeft={hoursLeft} />
        ) : (
          <View style={styles.center}>
            <Text variant="body" tone="secondary">No active challenges</Text>
          </View>
        )}
      </View>

      <View style={styles.feedSectionHeader}>
        <Text variant="header" tone="secondary">Community</Text>
        <Icon name="people" size={20} color="rgba(255,255,255,0.4)" />
      </View>
    </View>
  );

  return (
    <ScreenBackground variant="default">
      <FlatList
        data={feedPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          feedLoading ? (
            <View style={styles.feedLoadingArea}>
              <Loader visible={true} overlayStyle={styles.loaderTransparent} />
            </View>
          ) : (
            <View style={styles.emptyFeed}>
              <Icon name="images-outline" size={34} color="rgba(255,255,255,0.3)" />
              <Text variant="body" tone="secondary" align="center">
                No posts yet. Be the first to share!
              </Text>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  listHeader: {
    marginBottom: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  username: {
    fontWeight: '600',
  },
  challengeArea: {
    marginTop: spacing['2xl'] + spacing.lg,
  },
  challengeLoadingArea: {
    height: 120,
  },
  loaderTransparent: {
    backgroundColor: 'transparent',
  },
  center: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  feedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing['2xl'],
    marginBottom: spacing.sm,
  },
  feedLoadingArea: {
    height: 300,
  },
  separator: {
    height: spacing['2xl'],
  },
  emptyFeed: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing['2xl'],
  },
});
