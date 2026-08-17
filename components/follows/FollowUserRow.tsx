import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { UserAvatar } from '../ui/userAvatar';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { Row } from '../layout/row';
import type { FollowUserSummaryContract } from '../../types/follow';

interface FollowUserRowProps {
  user: FollowUserSummaryContract;
  /** Whether the session user actively follows this row's user. */
  isFollowing: boolean;
  /** True while ANY row's follow/unfollow is in flight (disables all rows). */
  busy: boolean;
  /** True while THIS row's action is in flight (shows the spinner). */
  processing: boolean;
  onToggle: (user: FollowUserSummaryContract) => void;
}

/** One row in the followers/following list — avatar, @username, follow pill. */
export function FollowUserRow({ user, isFollowing, busy, processing, onToggle }: FollowUserRowProps) {
  const { t } = useTranslation();

  return (
    <Row align="center" gap="md">
      <UserAvatar username={user.username} size={44} />
      <Text variant="body" numberOfLines={1} style={styles.name}>
        @{user.username}
      </Text>
      <Button
        variant={isFollowing ? 'outline' : 'primary'}
        size="sm"
        disabled={busy}
        loading={processing}
        onPress={() => onToggle(user)}
      >
        {isFollowing ? t('follows.followingButton') : t('follows.follow')}
      </Button>
    </Row>
  );
}

const styles = StyleSheet.create({
  name: {
    flex: 1,
    fontWeight: '700',
  },
});
