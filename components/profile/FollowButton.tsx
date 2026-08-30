import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { useFollowUser } from '../../hooks/useFollowUser';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  size?: 'sm' | 'md';
  /** Called after every successful (server-confirmed) follow/unfollow toggle. */
  onChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ userId, initialIsFollowing, size = 'md', onChange }: FollowButtonProps) {
  const { t } = useTranslation();
  const { isFollowing, pending, toggle } = useFollowUser(userId, initialIsFollowing);

  return (
    <Button
      // Fixed 2026-08-29, per explicit "doesn't match the design system"
      // report: was 'outline' (bordered), a deliberate-but-flagged deviation
      // from the wireframe's softer translucent-fill/no-border "Following"
      // pill — see Button's own `subtle` variant doc comment.
      variant={isFollowing ? 'subtle' : 'primary'}
      size={size}
      loading={pending}
      onPress={async () => {
        const confirmed = await toggle();
        onChange?.(confirmed);
      }}
      accessibilityRole="button"
      accessibilityLabel={
        isFollowing ? t('profile.unfollowButtonA11y') : t('profile.followButtonA11y')
      }
    >
      {isFollowing ? t('profile.followingButton') : t('profile.followButton')}
    </Button>
  );
}
