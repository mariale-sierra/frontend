import { useCallback, useEffect, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { FeedPostCard } from '../../components/home/FeedPostCard';
import { usePostViewerStore } from '../../store/postViewerStore';
import { safeBack } from '../../utils/navigation';
import { spacing } from '../../constants/theme';
import { FEED_POST_GAP } from '../../constants/feed';
import type { FeedPostViewModel } from '../../services/adapters/feedAdapter';

const HEADER_SIDE_SIZE = 44;
// How many times to retry the jump to the tapped post while its row is still
// unmeasured (FlatList needs the rows above it laid out first).
const SCROLL_RETRY_LIMIT = 5;
const SCROLL_RETRY_DELAY_MS = 50;

/**
 * A profile's posts as a feed (Sprint 9, B5): opened from a photo in a
 * profile grid (yours or someone else's) or from a post shared in a chat. It
 * opens ON the tapped post and scrolls through the rest, each one a full
 * `FeedPostCard` — react, see who reacted, comment, share, the challenge, the
 * logged metrics. A real screen, not a modal, so everything a card opens
 * (a profile, a challenge, a chat) lands on top of it with Back to return.
 */
export default function ProfilePosts() {
  const { t } = useTranslation();
  const posts = usePostViewerStore((state) => state.posts);
  const startId = usePostViewerStore((state) => state.startId);
  const remove = usePostViewerStore((state) => state.remove);
  const listRef = useRef<FlatList<FeedPostViewModel>>(null);
  const startIndex = Math.max(
    0,
    posts.findIndex((post) => post.id === startId),
  );
  const jumpedRef = useRef(false);
  const retriesRef = useRef(0);

  // Nothing to show (opened without posts, or you deleted the last one).
  useEffect(() => {
    if (posts.length === 0) safeBack('/(tabs)/profile');
  }, [posts.length]);

  const jumpToStart = useCallback(() => {
    if (jumpedRef.current || startIndex === 0) return;
    jumpedRef.current = true;
    listRef.current?.scrollToIndex({ index: startIndex, animated: false });
  }, [startIndex]);

  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      // Rows above aren't measured yet: get close with the average height,
      // then try the exact jump again once they are.
      listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
      if (retriesRef.current >= SCROLL_RETRY_LIMIT) return;
      retriesRef.current += 1;
      setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: false }), SCROLL_RETRY_DELAY_MS);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedPostViewModel }) => <FeedPostCard post={item} onDeleted={remove} />,
    [remove],
  );

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('profile.postsScreenTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <FlatList
        ref={listRef}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.list}
        onLayout={jumpToStart}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        initialNumToRender={Math.min(posts.length, startIndex + 2)}
        showsVerticalScrollIndicator={false}
        testID="profile-posts-list"
      />
    </ScreenBackground>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  headerSpacer: {
    width: HEADER_SIDE_SIZE,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  // Same air between posts as the Home feed (constants/feed.ts).
  separator: {
    height: FEED_POST_GAP,
  },
});
