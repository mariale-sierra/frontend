import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { spacing } from '../../constants/theme';

interface FollowListItemProps {
  /** Structural, not `FollowUserSummaryContract` specifically — any user
   * summary shape with at least these two fields works (e.g. a challenge
   * member from `ChallengeParticipantContract`, reused as-is by the
   * Challenge Detail screen's Members list). The photo and display name are
   * shown when the shape carries them (space members, reactors). */
  user: {
    id: string;
    username: string;
    profileImageUrl?: string | null;
    displayName?: string | null;
  };
  /** Runs before navigating — a list inside a sheet closes itself here so
   * the profile isn't pushed underneath the still-open modal. */
  onNavigate?: () => void;
}

/** One row in a followers/following/members list — taps through to that user's profile. */
export function FollowListItem({ user, onNavigate }: FollowListItemProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        onNavigate?.();
        router.push(`/profile/${user.id}`);
      }}
      accessibilityRole="button"
    >
      <Row align="center" gap="md" style={styles.row}>
        <UserAvatar username={user.username} imageUrl={user.profileImageUrl ?? null} size={44} />
        <View style={styles.names}>
          {user.displayName ? (
            <>
              <Text variant="body" weight="medium" numberOfLines={1}>
                {user.displayName}
              </Text>
              <Text variant="caption" tone="secondary" numberOfLines={1}>
                @{user.username}
              </Text>
            </>
          ) : (
            <Text variant="body" weight="medium" numberOfLines={1}>
              @{user.username}
            </Text>
          )}
        </View>
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.xs,
  },
  names: {
    flex: 1,
  },
});
