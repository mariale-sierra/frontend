import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui/skeleton';
import { radius, spacing } from '../../constants/theme';

const AVATAR_SIZE = 64;
const ITEM_COUNT = 8;

/** Mirrors StreakGridItem's shape (64px avatar circle + name line) in the
 * same 4-column layout — shown while the one getFollowingStreaks() fetch is
 * in flight, instead of a bare centered spinner. */
export function StreaksGridSkeleton() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: ITEM_COUNT }, (_, index) => (
        <View key={index} style={styles.item}>
          <Skeleton width={AVATAR_SIZE} height={AVATAR_SIZE} radius={radius.big} strong />
          <Skeleton width={40} height={10} />
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
    width: '25%',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
