import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { spacing } from '../../constants/theme';

interface FollowListItemProps {
  /** Structural, not `FollowUserSummaryContract` specifically — any user
   * summary shape with at least these two fields works (e.g. a challenge
   * member from `ChallengeParticipantContract`, reused as-is by the
   * Challenge Detail screen's Members list). */
  user: { id: string; username: string };
}

/** One row in a followers/following/members list — taps through to that user's profile. */
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
