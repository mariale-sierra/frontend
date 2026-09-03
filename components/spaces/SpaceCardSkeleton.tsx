import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui/skeleton';
import { Row } from '../layout/row';
import { colors, radius, spacing } from '../../constants/theme';

// Mirrors SpaceCard's own shape (badge + title column, a CTA pill, a
// description line, a members row) so the Spaces section doesn't jump in
// size once real cards replace this.
export function SpaceCardSkeleton() {
  return (
    <View style={styles.card}>
      <Row align="flex-start" justify="space-between" gap="md">
        <View style={styles.titleColumn}>
          <Skeleton width={64} height={20} radius={radius.small} strong />
          <Skeleton width="70%" height={16} />
        </View>
        <Skeleton width={90} height={32} radius={radius.big} strong />
      </Row>
      <Skeleton width="90%" height={13} />
      <Skeleton width={100} height={12} style={styles.membersRow} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.big,
    padding: spacing.md,
    gap: spacing.sm,
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
