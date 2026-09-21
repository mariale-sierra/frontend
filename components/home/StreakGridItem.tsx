import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { colors, radius, spacing } from '../../constants/theme';

interface StreakGridItemProps {
  username: string;
  avatarUrl?: string;
  streakDays: number;
  loggedToday: boolean;
  /** The avatar's diameter — what its column allows (`getStreakGridLayout`). */
  size: number;
}

export function StreakGridItem({ username, avatarUrl, streakDays, loggedToday, size }: StreakGridItemProps) {
  // Same rule as FriendStreakCard: `success` badge when logged today, dark
  // `surface` otherwise.
  const badgeColor = loggedToday ? colors.success : colors.surface;

  return (
    <View style={[styles.item, { width: size }]}>
      <View style={{ width: size, height: size }}>
        <UserAvatar username={username} imageUrl={avatarUrl} size={size} circle />
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text variant="caption" weight="bold" inverse={loggedToday}>
            {streakDays}
          </Text>
        </View>
      </View>
      <Text variant="caption" tone="secondary" numberOfLines={1} style={[styles.name, { width: size }]}>
        {username}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    gap: spacing.xs,
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
    textAlign: 'center',
  },
});
