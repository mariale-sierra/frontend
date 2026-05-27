import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useChallengeProgress } from '../../hooks/useChallengeProgress';
import ScreenBackground from '../../components/layout/screenBackground';
import { Icon } from '../../components/ui/icon';
import { Loader } from '../../components/ui/loader';
import { Text } from '../../components/ui/text';
import { UserAvatar } from '../../components/ui/userAvatar';
import { ActiveChallengeSection } from '../../components/home/ActiveChallengeSection';
import { FeedPostCard } from '../../components/home/FeedPostCard';
import type { HomeActiveChallengeViewModel } from '../../services/adapters/homeAdapter';
import { getHomeFeed } from '../../services/feed/feed.service';
import { toFeedPostViewModels } from '../../services/adapters/feedAdapter';
import type { FeedPostViewModel } from '../../services/adapters/feedAdapter';
// REMOVE_MOCK_START
import { buildMockFeedPosts } from '../../services/mocks/feedMock';
// REMOVE_MOCK_END
import { spacing } from '../../constants/theme';
import { hoursUntilMidnight } from '../../utils/time';

// REMOVE_MOCK_START: delete once all three badge states are validated in production
const MOCK_BADGE_CHALLENGES: HomeActiveChallengeViewModel[] = [
  { challengeId: 'mock-time',  title: 'Iron Will',         currentDay: 14, totalDays: 75, isTodayCompleted: false, isCompleted: false, activityType: 'strength',     isRestDay: false },
  { challengeId: 'mock-done',  title: 'Thirty Day Flex',   currentDay: 30, totalDays: 30, isTodayCompleted: true,  isCompleted: true,  activityType: 'flexibility',  isRestDay: false },
  { challengeId: 'mock-rest',  title: 'Morning Cardio 21', currentDay: 8,  totalDays: 21, isTodayCompleted: false, isCompleted: false, activityType: 'cardioLow',    isRestDay: true  },
];
// REMOVE_MOCK_END

export default function Home() {
  const { username } = useAuth();
  const insets = useSafeAreaInsets();
  const { challenge: activeChallenge, loading: challengeLoading } = useChallengeProgress();

  const [feedPosts, setFeedPosts] = useState<FeedPostViewModel[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  const hoursLeft = hoursUntilMidnight();
  const challenges: HomeActiveChallengeViewModel[] = activeChallenge ? [activeChallenge] : [];

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
          <ActiveChallengeSection challenges={[...MOCK_BADGE_CHALLENGES, ...challenges]} hoursLeft={hoursLeft} />
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
