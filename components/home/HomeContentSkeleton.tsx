import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui/skeleton';
import { Row } from '../layout/row';
import { Stack } from '../layout/stack';
import { PostCardSkeleton } from './PostCardSkeleton';
import { radius, spacing } from '../../constants/theme';
import { FEED_POST_GAP_TOKEN, FEED_POST_INSET, HOME_EDGE_INSET } from '../../constants/feed';

const STREAK_AVATAR_SIZE = 58;

/**
 * One combined placeholder for everything on Home that depends on a fetch
 * (hero card, streaks row, feed) — shown for as long as ANY of those are
 * still loading, so the screen reveals once, fully populated, instead of
 * popping in section by section. Swap back to per-section loading states by
 * reverting the `isReady` gate in app/(tabs)/index.tsx; this component has
 * no other dependency on that screen.
 */
export function HomeContentSkeleton() {
  return (
    <Stack gap="xl">
      <View style={styles.inset}>
        <Skeleton height={168} radius={radius.big} />
      </View>

      <Row gap="md" style={styles.inset}>
        {[0, 1, 2, 3].map((key) => (
          <View key={key} style={styles.streakItem}>
            <Skeleton width={STREAK_AVATAR_SIZE} height={STREAK_AVATAR_SIZE} radius={radius.big} strong />
            <Skeleton width={40} height={10} />
          </View>
        ))}
      </Row>

      <Stack gap={FEED_POST_GAP_TOKEN}>
        <PostCardSkeleton inset={FEED_POST_INSET} />
        <PostCardSkeleton inset={FEED_POST_INSET} />
      </Stack>
    </Stack>
  );
}

const styles = StyleSheet.create({
  // Same layout as the real Home: content inset, photos edge to edge.
  inset: {
    paddingHorizontal: HOME_EDGE_INSET,
  },
  streakItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
});
