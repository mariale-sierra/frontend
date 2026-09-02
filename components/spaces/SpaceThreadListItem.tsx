import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { SpaceAvatar } from './SpaceAvatar';
import { Row } from '../layout/row';
import { colors, spacing } from '../../constants/theme';
import { formatRelativeTime } from '../../utils/time';
import { getSpaceAccentColor } from '../../services/adapters/spaceAdapter';
import type { SpaceContract, SpaceMessageContract } from '../../types/space';

interface SpaceThreadListItemProps {
  space: SpaceContract;
  lastMessage: SpaceMessageContract | null;
  /** ISO timestamp this device last opened this thread, or `null` if never
   * — see `utils/spaceThreadReads.ts`. Space messages have no server-side
   * read-tracking (unlike 1:1 conversations' real `unreadCount`), so this
   * locally-persisted "have I opened it since" is the best available signal. */
  lastViewedAt: string | null;
  currentUserId: string | null;
  onPress: () => void;
}

// Same fixed 7px dot slot and `success` fill as ConversationListItem's own
// unread dot — same meaning, just driven by `lastViewedAt` (a local
// approximation) instead of a real server `unreadCount`.
const DOT_SIZE = 7;

// Same size as ConversationListItem's own (bumped from 44 per an earlier
// explicit request) — these rows sit in the same merged list, so they need
// to match, not the Chats-46A wireframe's original smaller 44px space rows.
const AVATAR_SIZE = 56;

/**
 * A joined space's own row in the Messages list (Chats-46A: once you're a
 * member or the owner, the space moves out of "Spaces" — that section is
 * for exploring ones you haven't joined — and lives here like any other
 * thread, sorted by its own latest activity).
 */
export function SpaceThreadListItem({
  space,
  lastMessage,
  lastViewedAt,
  currentUserId,
  onPress,
}: SpaceThreadListItemProps) {
  const { t } = useTranslation();
  const accentColor = getSpaceAccentColor(space);

  const sentByMe = lastMessage?.sender.id === currentUserId;
  const hasUnread =
    !!lastMessage &&
    !sentByMe &&
    (!lastViewedAt || new Date(lastMessage.sentAt).getTime() > new Date(lastViewedAt).getTime());

  const preview = lastMessage
    ? sentByMe
      ? t('chats.lastMessageFromYou', { message: lastMessage.content })
      : t('spaces.lastMessagePreview', {
          sender: lastMessage.sender.displayName ?? `@${lastMessage.sender.username}`,
          message: lastMessage.content,
        })
    : t('spaces.noMessagesYet');

  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.row}>
      <Row align="center" gap="md">
        <SpaceAvatar name={space.name} accentColor={accentColor} imageUrl={space.imageUrl} size={AVATAR_SIZE} />
        <View style={styles.content}>
          <Row align="center" gap="xs" justify="flex-start">
            <View
              testID="unread-dot"
              style={[styles.dot, { backgroundColor: hasUnread ? colors.success : 'transparent' }]}
            />
            {/* Custom `color` override needs an explicit `opacity: 1` — see
                components/ui/text.tsx's own documented warning, already hit
                (and fixed) elsewhere in Spaces this session. */}
            <Text
              variant="body"
              weight="bold"
              numberOfLines={1}
              style={[styles.name, { color: accentColor, opacity: 1 }]}
            >
              {space.name}
            </Text>
          </Row>
          <Row align="center" gap="xs" justify="flex-start">
            <View style={styles.dot} />
            <Text
              variant="body"
              tone={hasUnread ? undefined : 'secondary'}
              weight={hasUnread ? 'medium' : undefined}
              numberOfLines={1}
              style={styles.name}
            >
              {preview}
            </Text>
          </Row>
        </View>
        {lastMessage && (
          <Text variant="caption" tone="secondary">
            {formatRelativeTime(lastMessage.sentAt)}
          </Text>
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
    gap: spacing(0),
  },
  name: {
    flexShrink: 1,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: 'transparent',
  },
});
