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
              weight={hasUnread ? 'bold' : undefined}
              numberOfLines={1}
            >
              {name}
            </Text>
            {lastMessage && (
              <Text variant="caption" tone="secondary">{formatRelativeTime(lastMessage.sentAt)}</Text>
            )}
          </Row>
          <Row justify="space-between" align="center" gap="sm">
            {/* Merged onto current tokens 2026-08-31 — the branch this came
                from predates this app's design-system pass and referenced
                tokens that no longer exist (`spacing.xxs`, `radius['2xl']`,
                `colors.textPrimary`/`textInverse`). Unread emphasis is now
                done the same way every other "make this text stand out"
                case in the app does it — `Text`'s own `tone`/`weight` props
                (undefined tone = the component's own default 'primary'
                85%-opacity paper, a real step up from `secondary`'s 55%)
                — rather than a raw, now-nonexistent color token. */}
            <Text
              variant="body"
              tone={hasUnread ? undefined : 'secondary'}
              weight={hasUnread ? 'medium' : undefined}
              style={styles.preview}
              numberOfLines={1}
            >
              {preview}
            </Text>
            {hasUnread && (
              <View style={styles.badge}>
                <Text variant="caption" weight="bold" inverse>
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
    gap: spacing.xs,
  },
  preview: {
    flex: 1,
  },
  // `radius.big` (28) — was `radius['2xl']` (doesn't exist on the current
  // scale, which tops out at `xl`/40 — see theme.ts). `big` on a 20px-tall
  // badge still renders as a full pill/circle (any radius ≥ half the
  // element's own height does), matching every other small round badge in
  // the app.
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.big,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
