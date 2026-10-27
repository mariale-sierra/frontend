import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { colors, radius, spacing } from '../../constants/theme';
import type { FriendStreakViewModel } from '../../services/adapters/followAdapter';

interface FriendStreakCardProps {
  friend: FriendStreakViewModel;
  /** Called with the friend's id once their profile photo is on screen. */
  onAvatarLoadEnd?: (userId: string) => void;
}

const AVATAR_SIZE = 58;

export const FriendStreakCard = memo(function FriendStreakCard({ friend, onAvatarLoadEnd }: FriendStreakCardProps) {
  // Sprint 10: the same rounded counter as the profile's streak badge (without
  // its flame) — whiteish `primary` with ink text, turning `success` green with
  // a white label once this friend logged a workout today.
  const badgeColor = friend.loggedToday ? colors.success : colors.primary;

  return (
    <View style={styles.card}>
      <View style={styles.avatarWrap}>
        <UserAvatar
          username={friend.username}
          imageUrl={friend.avatarUrl}
          size={AVATAR_SIZE}
          onLoadEnd={onAvatarLoadEnd ? () => onAvatarLoadEnd(friend.userId) : undefined}
        />
        <View style={styles.badgeRow} pointerEvents="none">
          <View style={[styles.badge, { backgroundColor: badgeColor }]} testID={`friend-streak-badge-${friend.userId}`}>
            <Text variant="caption" weight="bold" inverse={!friend.loggedToday}>
              {friend.streakDays}
            </Text>
          </View>
        </View>
      </View>
      <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.name}>
        {friend.username}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: AVATAR_SIZE + spacing.xs,
    alignItems: 'center',
    // Grows with the badge's `bottom` offset (each step down is matched here)
    // to keep the badge→username gap visually unchanged.
    gap: spacing.base,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  // Centers the badge under the avatar whatever its width (1 or 3 digits).
  badgeRow: {
    position: 'absolute',
    // Sprint 10: one more step down (was `-sm`), so the pill hangs a bit
    // further below the avatar.
    bottom: -spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  // Same pill as ProfileHeader's `streakBadge`.
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
    maxWidth: AVATAR_SIZE + spacing.xs,
    textAlign: 'center',
  },
});
