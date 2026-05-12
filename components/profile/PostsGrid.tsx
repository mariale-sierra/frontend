import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

function PostSkeleton() {
  return <View style={styles.skeleton} />;
}

function SkeletonRow() {
  return (
    <View style={styles.row}>
      <PostSkeleton />
      <PostSkeleton />
    </View>
  );
}

const ROW_COUNT = 4;

export function PostsGrid() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  skeleton: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
  },
});
