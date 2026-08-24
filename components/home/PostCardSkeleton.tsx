import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

// Mirrors FeedPostCard's layout (header row + 3/4 photo + footer) so the
// feed doesn't jump in size once real posts replace the skeleton.
export function PostCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar} />
        <View style={styles.usernameLine} />
      </View>
      <View style={styles.photo} />
      <View style={styles.footer}>
        <View style={styles.captionLine} />
        <View style={styles.metaLine} />
      </View>
    </View>
  );
}

const SHIMMER = withAlpha(colors.paper, 0.08);
const SHIMMER_STRONG = withAlpha(colors.paper, 0.12);

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.big,
    backgroundColor: SHIMMER_STRONG,
  },
  usernameLine: {
    width: 90,
    height: 12,
    borderRadius: radius.small,
    backgroundColor: SHIMMER_STRONG,
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.medium,
    backgroundColor: SHIMMER,
  },
  footer: {
    gap: spacing.sm,
  },
  captionLine: {
    width: '80%',
    height: 12,
    borderRadius: radius.small,
    backgroundColor: SHIMMER,
  },
  metaLine: {
    width: '40%',
    height: 10,
    borderRadius: radius.small,
    backgroundColor: SHIMMER,
  },
});
