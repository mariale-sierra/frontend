import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { FollowButton } from '../profile/FollowButton';
import { Row } from '../layout/row';
import { colors, spacing } from '../../constants/theme';
import type { PublicProfileContract } from '../../types/user';

interface SearchUserRowProps {
  user: PublicProfileContract;
}

/**
 * One "People" result row (Search-Results wireframe) — a plain row, no card
 * container (it had a `surface` card until 2026-10-20), reusing `FollowButton` (already
 * shipped on the other-user profile screen) rather than a new follow
 * control. The flame/streak badge only renders when `streak_days` is
 * present, same graceful-hide rule `ProfileHeader`'s own streak badge
 * already follows — GET /users/search sends it batched (one query for the
 * whole result page) since 2026-09-22, but omits it for a private account
 * the caller doesn't follow, same as any other profile stat (see
 * `PublicProfileContract.streak_days`).
 */
export function SearchUserRow({ user }: SearchUserRowProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => router.push(`/profile/${user.id}`)}
        style={({ pressed }) => [styles.identity, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <UserAvatar username={user.username} imageUrl={user.profile_image_url} size={48} />
        <View style={styles.textColumn}>
          <Text variant="body" weight="bold" numberOfLines={1}>{user.display_name || user.username}</Text>
          <Row gap="xs" align="center" justify="flex-start">
            <Text variant="caption" tone="secondary" numberOfLines={1}>{`@${user.username}`}</Text>
            {user.streak_days != null && (
              <Row gap="xs" align="center" justify="flex-start">
                <Icon name="flame-outline" size={12} color={colors.primary} />
                <Text
                  variant="caption"
                  weight="bold"
                  style={styles.streakText}
                  accessibilityLabel={t('search.streakA11y', { count: user.streak_days })}
                >
                  {user.streak_days}
                </Text>
              </Row>
            )}
          </Row>
        </View>
      </Pressable>

      <FollowButton userId={user.id} initialIsFollowing={user.is_following} />
    </View>
  );
}

const styles = StyleSheet.create({
  // No card container (2026-10-20, explicit request): the row sits straight on
  // the screen, its avatar on the screen's edge margin like the section title.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  streakText: {
    color: colors.primary,
    opacity: 1,
  },
});
