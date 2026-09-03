import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui/skeleton';
import { radius, spacing } from '../../constants/theme';

// Mirrors SpacePreview's own hero shape (Chats-49A/49B: avatar, category
// badge, name, meta line, description) — shown while the space itself is
// still loading.
export function SpacePreviewSkeleton() {
  return (
    <View style={styles.hero}>
      <Skeleton width={72} height={72} radius={radius.big} strong />
      <Skeleton width={64} height={20} radius={radius.small} />
      <Skeleton width={200} height={24} />
      <Skeleton width={140} height={14} style={styles.meta} />
      <View style={styles.description}>
        <Skeleton width="100%" height={13} />
        <Skeleton width="80%" height={13} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  meta: {
    marginTop: spacing.xs,
  },
  description: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
