import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { spacing } from '../../constants/theme';
import type { FollowUserSummaryContract } from '../../types/follow';

interface FollowListItemProps {
  user: FollowUserSummaryContract;
}

/** One row in a followers/following list — taps through to that user's profile. */
export function FollowListItem({ user }: FollowListItemProps) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/profile/${user.id}`)} accessibilityRole="button">
      <Row align="center" gap="md" style={styles.row}>
        <UserAvatar username={user.username} size={44} />
        <Text variant="body" style={styles.username} numberOfLines={1}>
          @{user.username}
        </Text>
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.xs,
  },
  username: {
    fontWeight: '600',
    flex: 1,
  },
});
