import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { colors, radius, spacing } from '../../constants/theme';

interface StreakGridItemProps {
  username: string;
  avatarUrl?: string;
  streakDays: number;
  loggedToday: boolean;
}

const AVATAR_SIZE = 64;

export function StreakGridItem({ username, avatarUrl, streakDays, loggedToday }: StreakGridItemProps) {
  // Same rule as FriendStreakCard: lime badge when logged today, dark
  // `surface` otherwise.
  const badgeColor = loggedToday ? colors.primary : colors.surface;

  return (
    <View style={styles.item}>
      <View style={styles.avatarWrap}>
        <UserAvatar username={username} imageUrl={avatarUrl} size={AVATAR_SIZE} />
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text variant="caption" weight="bold" inverse={loggedToday}>
            {streakDays}
          </Text>
        </View>
      </View>
      <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.name}>
        {username}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    width: AVATAR_SIZE,
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  badge: {
    position: 'absolute',
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
    width: AVATAR_SIZE,
    textAlign: 'center',
  },
});
