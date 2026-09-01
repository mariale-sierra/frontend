import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { colors, spacing } from '../../constants/theme';
import { formatRelativeTime } from '../../utils/time';
import type { ConversationSummaryContract } from '../../types/chat';

interface ConversationListItemProps {
  conversation: ConversationSummaryContract;
  currentUserId: string | null;
  onPress: () => void;
}

// A fixed 7px circle either way — unread gets `colors.primary`, read gets
// `transparent` at the SAME size, per the Chats-46A wireframe's own note:
// "unread = has one, read = spacer of the same width so names still align."
// A space-based thread (not built yet — see index.tsx's own doc comment)
// would use that space's own activity color here instead of `primary`.
const DOT_SIZE = 7;

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
          size={44}
        />
        <View style={styles.content}>
          <Row align="center" gap="xs">
            <View
              testID="unread-dot"
              style={[styles.dot, { backgroundColor: hasUnread ? colors.primary : 'transparent' }]}
            />
            <Text
              variant="body"
              weight={hasUnread ? 'bold' : undefined}
              numberOfLines={1}
              style={styles.name}
            >
              {name}
            </Text>
          </Row>
          <Text
            variant="body"
            tone={hasUnread ? undefined : 'secondary'}
            weight={hasUnread ? 'medium' : undefined}
            numberOfLines={1}
          >
            {preview}
          </Text>
        </View>
        {lastMessage && (
          <Text variant="caption" tone="secondary">{formatRelativeTime(lastMessage.sentAt)}</Text>
        )}
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
    gap: spacing.xs,
  },
  name: {
    flexShrink: 1,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
