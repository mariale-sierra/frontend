import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { colors, radius, spacing } from '../../constants/theme';
import { formatRelativeTime } from '../../utils/time';
import type { MessageContract } from '../../types/chat';

interface MessageBubbleProps {
  message: MessageContract;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
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
  );
}

const styles = StyleSheet.create({
  row: {
    // `spacing.xs` — was `spacing.xxs`, doesn't exist on the current scale
    // (floor is `xs`/4 — see theme.ts). Merged onto current tokens
    // 2026-08-31, same story as ConversationListItem.tsx right next to
    // this file — this branch predates the app's design-system pass.
    marginVertical: spacing.xs,
    maxWidth: '80%',
  },
  rowMine: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  rowTheirs: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
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
  // `xs`/4 on the current scale).
  timeMine: {
    marginTop: spacing.xs,
    marginRight: spacing.xs,
  },
  timeTheirs: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
