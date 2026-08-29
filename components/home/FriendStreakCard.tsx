import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { colors, radius, spacing } from '../../constants/theme';
import type { FriendStreakViewModel } from '../../services/adapters/followAdapter';

interface FriendStreakCardProps {
  friend: FriendStreakViewModel;
}

const AVATAR_SIZE = 58;

export function FriendStreakCard({ friend }: FriendStreakCardProps) {
  // Confirmed rule (see havit-design-system-SKILL.md Open Items): `success`
  // badge when this friend logged a workout today, dark `surface` otherwise.
  const badgeColor = friend.loggedToday ? colors.success : colors.surface;

  return (
    <View style={styles.card}>
      <View style={styles.avatarWrap}>
        <UserAvatar username={friend.username} imageUrl={friend.avatarUrl} size={AVATAR_SIZE} />
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text variant="caption" weight="bold" inverse={friend.loggedToday}>
            {friend.streakDays}
          </Text>
        </View>
      </View>
      <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.name}>
        {friend.username}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: AVATAR_SIZE + spacing.xs,
    alignItems: 'center',
    // Bumped one token up from `sm` to `md` — the badge below was moved
    // further down by that same `xs` step (see its `bottom` offset), so this
    // compensates to keep the badge→username gap visually unchanged.
    gap: spacing.md,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  badge: {
    position: 'absolute',
    // Moved down one token step from `-xs` — was sitting right at the
    // avatar's edge, now reads more clearly as "cut into" it lower down.
    bottom: -spacing.sm,
    left: '50%',
    transform: [{ translateX: -14 }],
    minWidth: 28,
    alignItems: 'center',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.small,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  name: {
    maxWidth: AVATAR_SIZE + spacing.xs,
    textAlign: 'center',
  },
});
