import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { colors, radius, spacing } from '../../constants/theme';
import { formatRelativeTime } from '../../utils/time';
import type { ConversationSummaryContract } from '../../types/chat';

interface ConversationListItemProps {
  conversation: ConversationSummaryContract;
  currentUserId: string | null;
  onPress: () => void;
}

export function ConversationListItem({
  conversation,
  currentUserId,
  onPress,
}: ConversationListItemProps) {
  const { t } = useTranslation();
  const { otherParticipant, lastMessage, unreadCount } = conversation;
  const name = otherParticipant.displayName ?? `@${otherParticipant.username}`;
  const hasUnread = unreadCount > 0;

  const preview = lastMessage
    ? lastMessage.senderId === currentUserId
      ? t('chats.lastMessageFromYou', { message: lastMessage.content })
      : lastMessage.content
    : t('chats.noMessagesYet');

  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.row}>
      <Row align="center" gap="md">
        <UserAvatar
          username={otherParticipant.username}
          imageUrl={otherParticipant.profileImageUrl}
          size={48}
        />
        <View style={styles.content}>
          <Row justify="space-between" align="center" gap="sm">
            <Text
              variant="body"
              style={hasUnread ? styles.nameUnread : undefined}
              numberOfLines={1}
            >
              {name}
            </Text>
            {lastMessage && (
              <Text variant="caption">{formatRelativeTime(lastMessage.sentAt)}</Text>
            )}
          </Row>
          <Row justify="space-between" align="center" gap="sm">
            <Text
              variant="body"
              tone="secondary"
              style={[styles.preview, hasUnread && styles.previewUnread]}
              numberOfLines={1}
            >
              {preview}
            </Text>
            {hasUnread && (
              <View style={styles.badge}>
                <Text variant="caption" style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </Row>
        </View>
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.sm,
  },
  content: {
    flex: 1,
    gap: spacing.xxs,
  },
  nameUnread: {
    fontWeight: '700',
  },
  preview: {
    flex: 1,
  },
  previewUnread: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: spacing.xs,
    borderRadius: radius['2xl'],
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.textInverse,
    fontWeight: '700',
  },
});
