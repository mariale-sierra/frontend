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
        <Text
          variant="body"
          style={isMine ? styles.textMine : undefined}
        >
          {message.content}
        </Text>
      </View>
      <Text variant="caption" style={isMine ? styles.timeMine : styles.timeTheirs}>
        {formatRelativeTime(message.sentAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: spacing.xxs,
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
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.sm,
  },
  textMine: {
    color: colors.textInverse,
  },
  timeMine: {
    marginTop: spacing.xxxs,
    marginRight: spacing.xs,
  },
  timeTheirs: {
    marginTop: spacing.xxxs,
    marginLeft: spacing.xs,
  },
});
