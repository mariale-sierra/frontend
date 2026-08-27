import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui/skeleton';
import { radius, spacing } from '../../constants/theme';

// Mirrors FeedPostCard's layout (header row + 3/4 photo + footer) so the
// feed doesn't jump in size once real posts replace the skeleton.
export function PostCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Skeleton width={32} height={32} radius={radius.big} strong />
        <Skeleton width={90} height={12} strong />
      </View>
      <Skeleton style={styles.photo} />
      <View style={styles.footer}>
        <Skeleton width="80%" height={12} />
        <Skeleton width="40%" height={10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.medium,
  },
  footer: {
    gap: spacing.sm,
  },
});
