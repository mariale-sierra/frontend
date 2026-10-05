import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui/skeleton';
import { radius, spacing } from '../../constants/theme';

const ROWS = 6;

/** Shape-matched loading state for the inbox (avatar + two text lines per row). */
export function NotificationListSkeleton() {
  return (
    <View style={styles.list}>
      {Array.from({ length: ROWS }, (_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={44} height={44} radius={radius.big} strong />
          <View style={styles.lines}>
            <Skeleton width="85%" height={14} />
            <Skeleton width="30%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  lines: {
    flex: 1,
    gap: spacing.sm,
  },
});
