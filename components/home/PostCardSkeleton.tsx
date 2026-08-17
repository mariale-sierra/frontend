import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

// Mirrors FeedPostCard's layout (3/4 photo + footer) so the feed doesn't
// jump in size once real posts replace the skeleton.
export function PostCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.photo}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar} />
          <View style={styles.usernameLine} />
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.captionLine} />
        <View style={styles.metaLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceHighlight,
  },
  usernameLine: {
    width: 70,
    height: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHighlight,
  },
  footer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  captionLine: {
    width: '80%',
    height: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  metaLine: {
    width: '40%',
    height: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
  },
});
