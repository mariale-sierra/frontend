import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui/skeleton';
import { Row } from '../layout/row';
import { Stack } from '../layout/stack';
import { PostCardSkeleton } from './PostCardSkeleton';
import { radius, spacing } from '../../constants/theme';

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
      <Skeleton height={168} radius={radius.big} />

      <Row gap="md">
        {[0, 1, 2, 3].map((key) => (
          <View key={key} style={styles.streakItem}>
            <Skeleton width={STREAK_AVATAR_SIZE} height={STREAK_AVATAR_SIZE} radius={radius.big} strong />
            <Skeleton width={40} height={10} />
          </View>
        ))}
      </Row>

      <Stack gap="2xl">
        <PostCardSkeleton />
        <PostCardSkeleton />
      </Stack>
    </Stack>
  );
}

const styles = StyleSheet.create({
  streakItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
});
