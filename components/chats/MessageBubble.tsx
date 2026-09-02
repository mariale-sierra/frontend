import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { colors, radius, spacing } from '../../constants/theme';
import { formatRelativeTime } from '../../utils/time';
import type { MessageContract } from '../../types/chat';

interface MessageBubbleProps {
  message: MessageContract;
  isMine: boolean;
  /** The other participant's avatar — Chats-47A renders it next to THEIR bubbles only, never next to mine. */
  otherAvatar?: { username: string; imageUrl: string | null };
}

const AVATAR_SIZE = 26;

export function MessageBubble({ message, isMine, otherAvatar }: MessageBubbleProps) {
  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      {!isMine && (
        <View style={styles.avatarSlot}>
          {otherAvatar && <UserAvatar username={otherAvatar.username} imageUrl={otherAvatar.imageUrl} size={AVATAR_SIZE} />}
        </View>
      )}
      <View style={[styles.bubbleColumn, isMine && styles.bubbleColumnMine]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          {/* `inverse` (→ `ink` text), not a raw `color: colors.textInverse`
              override — that token doesn't exist on the current theme (see
              radius/spacing notes below); `Text`'s own `inverse` prop is the
              real mechanism for "dark text on a light/`primary` background"
              everywhere else in the app. */}
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
    // `spacing.xs` — was `spacing.xxs`, doesn't exist on the current scale
    // (floor is `xs`/4 — see theme.ts). Merged onto current tokens
    // 2026-08-31, same story as ConversationListItem.tsx right next to
    // this file — this branch predates the app's design-system pass.
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
  // Fixed-width slot even when `otherAvatar` isn't resolved yet, so the
  // bubble column doesn't jump sideways once it loads.
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
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
  },
  // `radius.small` — was `radius.sm` (doesn't exist; the scale's small tier
  // is spelled `small`, not `sm`). Pinches just this one corner flat, the
  // standard "message tail" cue for which side sent it.
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.small,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.small,
  },
  // `spacing.xs` — was `spacing.xxxs`, doesn't exist (nothing smaller than
  // `xs`/4 on the current scale). Horizontal placement now comes from
  // `bubbleColumn`/`bubbleColumnMine`'s own `alignItems`, not a per-side
  // margin on the timestamp itself.
  timeMine: {
    marginTop: spacing.xs,
  },
  timeTheirs: {
    marginTop: spacing.xs,
  },
});
