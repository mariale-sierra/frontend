import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui/skeleton';
import { Row } from '../layout/row';
import { radius, spacing } from '../../constants/theme';

// Mirrors ConversationListItem/SpaceThreadListItem's shared row shape (a
// 56px avatar, a name line, a preview line) — both render identically, so
// one skeleton covers the merged Messages list either way.
const AVATAR_SIZE = 56;

export function MessageRowSkeleton() {
  return (
    <Row align="center" gap="md" style={styles.row}>
      <Skeleton width={AVATAR_SIZE} height={AVATAR_SIZE} radius={radius.big} strong />
      <View style={styles.content}>
        <Skeleton width="55%" height={16} />
        <Skeleton width="80%" height={13} style={styles.preview} />
      </View>
    </Row>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.sm,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  preview: {
    marginTop: spacing.xs,
  },
});
