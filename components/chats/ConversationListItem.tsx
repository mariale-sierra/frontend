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

// A fixed 7px circle either way — unread gets `colors.success` (switched
// from `primary` per explicit request — "success" reads as the semantically
// correct color for "something new/positive happened here" the same way it
// already does for the Home streak-chip/StreaksGrid badges elsewhere), read
// gets `transparent` at the SAME size, per the Chats-46A wireframe's own
// note: "unread = has one, read = spacer of the same width so names still
// align." This dot's meaning stays fixed even for a joined space's own row
// in this same list (`SpaceThreadListItem`) — per explicit request, that
// row's activity-color identity goes on the NAME text instead, not a
// repurposed dot (space messages also have no read-tracking to drive an
// unread dot with yet, unlike this one's real `unreadCount`).
const DOT_SIZE = 7;

// Bumped from 44, per explicit "make the profile circle bigger" request.
const AVATAR_SIZE = 56;

export function ConversationListItem({
  conversation,
  currentUserId,
  onPress,
}: ConversationListItemProps) {
  const { t } = useTranslation();
  const { otherParticipant, lastMessage, unreadCount, isPending } = conversation;
  const name = otherParticipant.displayName ?? `@${otherParticipant.username}`;
  const hasUnread = unreadCount > 0;

  const preview = isPending
    ? t('chats.messageRequestLabel')
    : lastMessage
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
          size={AVATAR_SIZE}
        />
        <View style={styles.content}>
          {/* `justify="flex-start"` — `Row` defaults to `space-between`,
              which with only two children (the dot + the name) shoves the
              name all the way to the far right of `content`'s full width
              instead of sitting right next to the dot. Real, reported bug,
              not a wireframe departure. */}
          <Row align="center" gap="xs" justify="flex-start">
            <View
              testID="unread-dot"
              style={[styles.dot, { backgroundColor: hasUnread ? colors.success : 'transparent' }]}
            />
            {/* Always bold, per the wireframe — every name in Chats-46A's
                message rows is weight 700 regardless of read state; only
                the PREVIEW line's weight/tone changes with `hasUnread`. */}
            <Text
              variant="body"
              weight="bold"
              numberOfLines={1}
              style={styles.name}
            >
              {name}
            </Text>
          </Row>
          {/* The preview line gets the SAME leading dot-width spacer (always
              transparent) so its text starts flush with the name's text
              above it — without this, the name (pushed right by the real
              dot) reads noticeably further from the avatar than the preview
              line does. Real, reported misalignment. */}
          <Row align="center" gap="xs" justify="flex-start">
            <View style={styles.dot} />
            {/* A pending request's own label always reads as "new" —
                bold + the app's accent color, like Instagram's own blue
                "Message request" line — regardless of `unreadCount` (a
                request you haven't acted on yet is never really "read"). */}
            <Text
              variant="body"
              tone={isPending || hasUnread ? undefined : 'secondary'}
              weight={isPending ? 'bold' : hasUnread ? 'medium' : undefined}
              numberOfLines={1}
              style={[styles.name, isPending && styles.pendingLabel]}
            >
              {preview}
            </Text>
          </Row>
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
    // `spacing.xs` (4) is already the scale's floor — closer than that
    // isn't a named tier, but `spacing(n)` is still the real token
    // mechanism for an arbitrary multiple-of-4 value (see its own doc
    // comment in theme.ts), not a raw magic number. Per explicit "name and
    // message label closer" request.
    gap: spacing(0),
  },
  name: {
    flexShrink: 1,
  },
  // Custom `color` override needs an explicit `opacity: 1` — see
  // components/ui/text.tsx's own documented warning.
  pendingLabel: {
    color: colors.primary,
    opacity: 1,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
