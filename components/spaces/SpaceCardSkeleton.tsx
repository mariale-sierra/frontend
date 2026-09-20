import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui/skeleton';
import { Row } from '../layout/row';
import { borderWidth, colors, radius, spacing } from '../../constants/theme';

// Mirrors SpaceCard's own shape (badge + title column, a CTA pill, a
// description line, a members row) so the Spaces section doesn't jump in
// size once real cards replace this.
export function SpaceCardSkeleton() {
  return (
    <View style={styles.card}>
      <Row align="flex-start" justify="space-between" gap="md">
        <View style={styles.titleColumn}>
          <Skeleton width={96} height={24} radius={radius.big} strong />
          <Skeleton width="70%" height={18} />
        </View>
        <Skeleton width={90} height={32} radius={radius.big} strong />
      </Row>
      <Skeleton width="90%" height={12} />
      <Skeleton width={100} height={16} style={styles.membersRow} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Same box as `SpaceCard` (`AccentCard`): the fine outline (invisible here) and
  // `md` padding.
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.big,
    borderWidth: borderWidth.fine,
    borderColor: 'transparent',
    padding: spacing.md,
    gap: spacing.xs,
  },
  titleColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  membersRow: {
    marginTop: spacing.xs,
  },
});
