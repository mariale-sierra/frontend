import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { SharedChallengeCard, SharedPostCard } from './SharedContentCard';
import { colors, radius, spacing } from '../../constants/theme';
import { formatRelativeTime } from '../../utils/time';
import type { MessageContract } from '../../types/chat';

interface MessageBubbleProps {
  message: MessageContract;
  isMine: boolean;
  /** The other participant's avatar — Chats-47A renders it next to THEIR bubbles only, never next to mine. */
  otherAvatar?: { username: string; imageUrl: string | null };
  /** Long-press on the bubble (B4: your own messages, to delete one). The
   * bubble looks exactly the same either way — no extra chrome per message. */
  onLongPress?: () => void;
  longPressA11yHint?: string;
}

const AVATAR_SIZE = 26;

export function MessageBubble({ message, isMine, otherAvatar, onLongPress, longPressA11yHint }: MessageBubbleProps) {
  // Sprint 10, B5: a shared post/challenge is its own card; any comment sent
  // with it is a regular bubble right under it. A share sent with no comment
  // has `content: ''` and gets no text bubble at all.
  const shared = message.sharedPost ? (
    <SharedPostCard post={message.sharedPost} />
  ) : message.sharedChallenge ? (
    <SharedChallengeCard challenge={message.sharedChallenge} />
  ) : null;

  const textBubble = message.content ? (
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
  ) : null;

  const bubble = shared ? (
    <View style={[styles.sharedStack, isMine && styles.bubbleColumnMine]}>
      {shared}
      {textBubble}
    </View>
  ) : (
    textBubble
  );

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      {!isMine && (
        <View style={styles.avatarSlot}>
          {otherAvatar && <UserAvatar username={otherAvatar.username} imageUrl={otherAvatar.imageUrl} size={AVATAR_SIZE} />}
        </View>
      )}
      <View style={[styles.bubbleColumn, isMine && styles.bubbleColumnMine]}>
        {onLongPress ? (
          <Pressable
            onLongPress={onLongPress}
            accessibilityHint={longPressA11yHint}
            testID={`message-bubble-${message.id}`}
          >
            {bubble}
          </Pressable>
        ) : (
          bubble
        )}
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
  sharedStack: {
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  // Bumped a tier each — `spacing.md`→`base`, `spacing.sm`→`md` — per
  // explicit "text too close to the bubble edge" report. Still real scale
  // tokens, just the next ones up, not arbitrary values.
  bubble: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
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
