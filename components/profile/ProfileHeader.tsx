import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  bio?: string | null;
  imageUrl?: string | null;
  /**
   * Overall daily-activity streak. No backend field sends this yet (see
   * types/user.ts) — omit it and both the flame badge on the avatar and the
   * "Day streak" stat column hide themselves rather than showing a
   * fabricated 0.
   */
  streakDays?: number;
  followersCount: number;
  followingCount: number;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
  /** Extra content below the stats row — e.g. a FollowButton on another user's profile. */
  actions?: React.ReactNode;
}

// Bumped 88 → 104, per explicit "make the profile pic bigger" request —
// still a plain per-component literal, not a spacing/radius token (avatar
// dimensions are inherently per-component, same exception `FAB_SIZE`/
// `THUMB_SIZE` already document elsewhere). 104 lands just above
// `app/profile/edit.tsx`'s own avatar (`size={96}`, the next-largest in the
// app) rather than an arbitrary jump — this screen is the main "view
// profile" identity moment, reasonable for it to be the single biggest
// avatar rendered anywhere, not smaller than the edit screen's own.
const AVATAR_SIZE = 104;

function StatColumn({
  value,
  label,
  onPress,
  highlight,
}: {
  value: number;
  label: string;
  onPress?: () => void;
  highlight?: boolean;
}) {
  const content = (
    <View style={styles.stat}>
      <Text variant="body" size="xl" weight="bold" style={highlight ? styles.statHighlight : undefined}>
        {value}
      </Text>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

function StatDivider() {
  return <View style={styles.statDivider} />;
}

export function ProfileHeader({
  displayName,
  username,
  bio,
  imageUrl,
  streakDays,
  followersCount,
  followingCount,
  onPressFollowers,
  onPressFollowing,
  actions,
}: ProfileHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <View style={styles.identity}>
        <View style={styles.avatarWrap}>
          <UserAvatar username={username} imageUrl={imageUrl} size={AVATAR_SIZE} />
          {streakDays != null && (
            <View style={styles.streakBadge}>
              <Icon name="flame-outline" size={12} color={colors.ink} />
              <Text variant="caption" weight="bold" inverse>
                {streakDays}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.nameBlock}>
          <Text variant="title" align="center">
            {displayName}
          </Text>
          <Text variant="label" weight="medium">
            @{username}
          </Text>
        </View>
      </View>

      {bio ? (
        <Text variant="body" tone="secondary" align="center">
          {bio}
        </Text>
      ) : null}

      <View style={styles.statsRow}>
        <StatColumn value={followersCount} label={t('profile.followersLabel')} onPress={onPressFollowers} />
        <StatDivider />
        <StatColumn value={followingCount} label={t('profile.followingLabel')} onPress={onPressFollowing} />
        {streakDays != null && (
          <>
            <StatDivider />
            <StatColumn value={streakDays} label={t('profile.streakLabel')} highlight />
          </>
        )}
      </View>

      {actions}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  identity: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  streakBadge: {
    position: 'absolute',
    bottom: -spacing.sm,
    left: '50%',
    transform: [{ translateX: -22 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.big,
    borderWidth: 3,
    borderColor: colors.ink,
    backgroundColor: colors.primary,
  },
  nameBlock: {
    alignItems: 'center',
    gap: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingTop: spacing.sm,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
    minWidth: 56,
  },
  statHighlight: {
    color: colors.primary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: withAlpha(colors.paper, 0.08),
  },
});
