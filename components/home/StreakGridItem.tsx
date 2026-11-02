import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { colors, radius, spacing } from '../../constants/theme';

interface StreakGridItemProps {
  /** Whose streak — tapping it opens their profile. */
  userId: string;
  username: string;
  avatarUrl?: string;
  streakDays: number;
  loggedToday: boolean;
  /** The avatar's diameter — what its column allows (`getStreakGridLayout`). */
  size: number;
  /** Called once the profile photo is on screen. */
  onAvatarLoadEnd?: () => void;
}

export function StreakGridItem({
  userId,
  username,
  avatarUrl,
  streakDays,
  loggedToday,
  size,
  onAvatarLoadEnd,
}: StreakGridItemProps) {
  // Same counter as FriendStreakCard (and the profile's streak badge): whiteish
  // `primary` pill with ink text, `success` green with a white label once this
  // friend logged a workout today.
  const badgeColor = loggedToday ? colors.success : colors.primary;

  const router = useRouter();

  return (
    // Sprint 10: tapping a friend opens their profile.
    <Pressable
      style={({ pressed }) => [styles.item, { width: size }, pressed && styles.pressed]}
      onPress={() => router.push(`/profile/${userId}`)}
      accessibilityRole="button"
      accessibilityLabel={username}
      testID={`streak-grid-item-${userId}`}
    >
      <View style={{ width: size, height: size }}>
        <UserAvatar username={username} imageUrl={avatarUrl} size={size} circle onLoadEnd={onAvatarLoadEnd} />
        <View style={styles.badgeRow} pointerEvents="none">
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text variant="caption" weight="bold" inverse={!loggedToday}>
              {streakDays}
            </Text>
          </View>
        </View>
      </View>
      <Text variant="caption" tone="secondary" numberOfLines={1} style={[styles.name, { width: size }]}>
        {username}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  item: {
    alignItems: 'center',
    // Clears the badge hanging below the avatar, same spacing as FriendStreakCard.
    gap: spacing.base,
  },
  // Centers the badge under the avatar whatever its width (1 or 3 digits).
  badgeRow: {
    position: 'absolute',
    bottom: -spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  // Same pill as FriendStreakCard and ProfileHeader's `streakBadge`.
  badge: {
    minWidth: 28,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.big,
    borderWidth: 3,
    borderColor: colors.ink,
  },
  name: {
    textAlign: 'center',
  },
});
