import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { UserAvatar, getUserAvatarColor } from '../ui/userAvatar';
import { colors, radius, spacing } from '../../constants/theme';

/**
 * UI-only view model: there is no backend endpoint for friends' streaks yet
 * (only the current user's own per-challenge streak exists today). Shaped so
 * a real service/adapter can be dropped in later without changing this card.
 */
export interface FriendStreakViewModel {
  userId: string;
  username: string;
  avatarUrl?: string;
  streakDays: number;
}

interface FriendStreakCardProps {
  friend: FriendStreakViewModel;
}

export function FriendStreakCard({ friend }: FriendStreakCardProps) {
  const { t } = useTranslation();
  const accentColor = getUserAvatarColor(friend.username);

  return (
    <View style={[styles.card, { borderColor: accentColor, shadowColor: accentColor }]}>
      <UserAvatar username={friend.username} imageUrl={friend.avatarUrl} size={36} />
      <Text variant="body" numberOfLines={1} style={styles.name}>
        {friend.username}
      </Text>
      <Text variant="label" style={[styles.days, { color: accentColor }]}>
        {t('home.streakDays', { count: friend.streakDays })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.background,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
    minWidth: 180,
  },
  name: {
    flex: 1,
  },
  days: {
    textTransform: 'none',
  },
});
