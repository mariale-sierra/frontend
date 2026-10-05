import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { UserAvatar } from '../ui/userAvatar';
import { colors, fillOpacity, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { formatRelativeTime } from '../../utils/time';
import { notificationText } from '../../services/notifications/notificationText';
import type { NotificationContract } from '../../types/notification';

const AVATAR_SIZE = 44;

/** Icon for rows with no person behind them (system events, deleted actors). */
const CATEGORY_ICON: Record<string, React.ComponentProps<typeof Icon>['name']> = {
  social: 'people-outline',
  messages: 'chatbubble-ellipses-outline',
  challenges: 'trophy-outline',
  spaces: 'chatbubbles-outline',
  moderation: 'shield-checkmark-outline',
};

interface NotificationListItemProps {
  notification: NotificationContract;
  onPress: (notification: NotificationContract) => void;
}

/**
 * One inbox row — List-row card (surface, `medium` radius). Unread rows keep
 * the card fill, full-strength text and the `accent` notification dot; read
 * rows drop the fill and mute the text, so the difference doesn't rely on
 * color alone.
 */
function NotificationListItemBase({ notification, onPress }: NotificationListItemProps) {
  const { t } = useTranslation();
  const unread = !notification.isRead;
  const text = notificationText(notification, t);
  const elapsedMs = Date.now() - new Date(notification.createdAt).getTime();
  const time = elapsedMs < 60_000 ? t('notifications.justNow') : formatRelativeTime(notification.createdAt);

  return (
    <Pressable
      onPress={() => onPress(notification)}
      accessibilityRole="button"
      accessibilityLabel={unread ? `${t('notifications.unread')}. ${text}` : text}
      style={({ pressed }) => [styles.row, unread && styles.rowUnread, pressed && styles.pressed]}
    >
      {notification.actor ? (
        <UserAvatar
          username={notification.actor.username}
          imageUrl={notification.actor.profileImageUrl}
          size={AVATAR_SIZE}
        />
      ) : (
        <View style={styles.systemIcon}>
          <Icon
            name={CATEGORY_ICON[notification.category] ?? 'notifications-outline'}
            size={22}
            color={withAlpha(colors.paper, textOpacity.primary)}
          />
        </View>
      )}

      <View style={styles.body}>
        <Text
          variant="body"
          size="sm"
          weight={unread ? 'medium' : 'regular'}
          tone={unread ? 'primary' : 'secondary'}
          numberOfLines={3}
        >
          {text}
        </Text>
        <Text variant="caption" tone={unread ? 'secondary' : 'tertiary'}>
          {time}
        </Text>
      </View>

      {unread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

export const NotificationListItem = memo(NotificationListItemBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.medium,
  },
  rowUnread: {
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.85,
  },
  systemIcon: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.paper, fillOpacity.chip),
  },
  body: {
    flex: 1,
    // Tight title + caption stack (design system's confirmed `2` exception).
    gap: 2,
  },
  unreadDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.small,
    backgroundColor: colors.accent,
  },
});
