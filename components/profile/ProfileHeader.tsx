import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { activityColors, colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { getPracticeOption } from '../../constants/practiceOptions';
import { ACTIVITY_ICON_NAME } from '../icons/activityIcon';
import { AccentPill } from '../ui/accentPill';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  bio?: string | null;
  imageUrl?: string | null;
  /**
   * Overall daily-activity streak — see types/user.ts's `streak_days` for
   * where the backend now sends it from. Still optional here: omit it and
   * both the flame badge on the avatar and the "Day streak" stat column
   * hide themselves rather than showing a fabricated 0 (a stranger viewing
   * a private profile, or an older cached response).
   */
  streakDays?: number;
  followersCount: number;
  followingCount: number;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
  /** Self-reported sport/fitness practices (see constants/practiceOptions.ts) —
   * rendered as a row of colored badges, one per entry still in the current
   * options list (see `getPracticeOption`). Omit or pass an empty array to
   * hide the row entirely — never privacy-gated, same tier as the name/photo. */
  practices?: string[];
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
  practices,
  actions,
}: ProfileHeaderProps) {
  const { t } = useTranslation();
  const practiceBadges = (practices ?? [])
    .map((value) => getPracticeOption(value))
    .filter((option): option is NonNullable<typeof option> => option !== null);

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
      </View>

      {practiceBadges.length > 0 && (
        <View style={[styles.badgesRow, styles.badgesRowGap]}>
          {practiceBadges.map((option) => (
            <AccentPill
              key={option.value}
              label={option.label}
              color={activityColors[option.activityType]}
              variant="filled"
              size="md"
              icon={ACTIVITY_ICON_NAME[option.activityType]}
            />
          ))}
        </View>
      )}

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
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  // On top of `wrapper`'s own uniform `spacing.md` gap (12) — a single
  // `gap` on that wrapper applies the same spacing between every child, so
  // this adds `spacing.md` more specifically above the badges row, per
  // explicit "make the gap between those two elements [stats row] and the
  // badges a bit bigger" — total effective gap now `spacing.lg` (24).
  badgesRowGap: {
    marginTop: spacing.md,
  },
});
