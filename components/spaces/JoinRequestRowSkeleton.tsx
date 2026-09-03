import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui/skeleton';
import { Row } from '../layout/row';
import { radius, spacing } from '../../constants/theme';

// Mirrors JoinRequestListItem's own row shape (avatar, name, two round
// approve/reject buttons) — Chats-47E, shown while requests are in flight.
export function JoinRequestRowSkeleton() {
  return (
    <Row align="center" gap="md" style={styles.row}>
      <Skeleton width={48} height={48} radius={radius.big} strong />
      <Skeleton width="45%" height={16} style={styles.name} />
      <Skeleton width={34} height={34} radius={radius.big} strong />
      <Skeleton width={34} height={34} radius={radius.big} strong />
    </Row>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.sm,
  },
  name: {
    flex: 1,
  },
});
