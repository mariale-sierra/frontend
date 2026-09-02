import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { colors, radius, spacing } from '../../constants/theme';
import { formatRelativeTime } from '../../utils/time';
import type { SpaceMessageContract } from '../../types/space';

interface SpaceMessageBubbleProps {
  message: SpaceMessageContract;
  isMine: boolean;
}

const AVATAR_SIZE = 26;

/**
 * Same bubble shape as 1:1 chat's `MessageBubble`, but a space is a group
 * thread — every message can come from a different member, so (unlike
 * `MessageBubble`'s single fixed `otherAvatar` prop) the sender's own avatar
 * AND name travel on each message and render above "theirs" bubbles, per
 * wireframe Chats-47B.
 */
export function SpaceMessageBubble({ message, isMine }: SpaceMessageBubbleProps) {
  const senderName = message.sender.displayName || `@${message.sender.username}`;

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      {!isMine && (
        <View style={styles.avatarSlot}>
          <UserAvatar
            username={message.sender.username}
            imageUrl={message.sender.profileImageUrl}
            size={AVATAR_SIZE}
          />
        </View>
      )}
      <View style={[styles.bubbleColumn, isMine && styles.bubbleColumnMine]}>
        {!isMine && (
          <Text variant="caption" weight="bold" style={styles.senderName}>
            {senderName}
          </Text>
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text variant="body" inverse={isMine}>
            {message.content}
          </Text>
        </View>
        <Text variant="caption" tone="secondary" style={isMine ? styles.timeMine : styles.timeTheirs}>
          {formatRelativeTime(message.sentAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    marginVertical: spacing.xs,
    maxWidth: '80%',
  },
  rowMine: {
    alignSelf: 'flex-end',
  },
  rowTheirs: {
    alignSelf: 'flex-start',
  },
  avatarSlot: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  bubbleColumn: {
    flexShrink: 1,
    alignItems: 'flex-start',
  },
  bubbleColumnMine: {
    alignItems: 'flex-end',
  },
  senderName: {
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  bubble: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.small,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.small,
  },
  timeMine: {
    marginTop: spacing.xs,
  },
  timeTheirs: {
    marginTop: spacing.xs,
  },
});
