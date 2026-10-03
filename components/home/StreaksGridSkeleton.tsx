import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui/skeleton';
import { STREAK_GRID_COLUMNS } from '../../constants/streaksGrid';
import { fontSize, spacing } from '../../constants/theme';

// Two rows' worth of friends.
const ITEM_COUNT = STREAK_GRID_COLUMNS * 2;
// The name line under an avatar: as wide as this share of it.
const NAME_LINE_SHARE = 0.6;

interface StreaksGridSkeletonProps {
  /** The avatar's diameter (`getStreakGridLayout`), so the skeleton is the tiles' size. */
  avatarSize: number;
}

/** Mirrors StreakGridItem's shape (a round avatar and a name line) in the same
 * three-column layout — shown while the one getFollowingStreaks() fetch is in flight,
 * instead of a bare centered spinner. */
export function StreaksGridSkeleton({ avatarSize }: StreaksGridSkeletonProps) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: ITEM_COUNT }, (_, index) => (
        <View key={index} style={styles.item}>
          <Skeleton width={avatarSize} height={avatarSize} radius={avatarSize / 2} strong />
          <Skeleton width={avatarSize * NAME_LINE_SHARE} height={fontSize.xs} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
  },
  item: {
    width: `${100 / STREAK_GRID_COLUMNS}%`,
    alignItems: 'center',
    gap: spacing.xs,
  },
});
