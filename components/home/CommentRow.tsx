import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconButton } from '../ui/iconButton';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { colors, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import type { CommentViewModel } from '../../services/adapters/workoutPostSocialAdapter';

const AVATAR_SIZE = 32;

interface CommentRowProps {
  comment: CommentViewModel;
  isMine: boolean;
  onDelete: () => void;
  /** Report someone else's comment (Sprint 8, B2). */
  onReport?: () => void;
}

/** One comment row in CommentsSheet — avatar + name/timestamp + body, with a
 * trailing delete action for the viewer's own comment, or a report action
 * for anyone else's. */
export function CommentRow({ comment, isMine, onDelete, onReport }: CommentRowProps) {
  const { t } = useTranslation();
  return (
    <Row align="flex-start" gap="sm">
      <UserAvatar username={comment.authorName} imageUrl={comment.authorAvatarUrl} size={AVATAR_SIZE} />
      <View style={styles.textColumn}>
        <Row gap="xs" justify="flex-start">
          <Text variant="label" weight="bold" numberOfLines={1}>{comment.authorName}</Text>
          <Text variant="caption" tone="secondary">{comment.createdAt}</Text>
        </Row>
        <Text variant="body">{comment.content}</Text>
      </View>
      {isMine && (
        <IconButton
          testID="comment-delete"
          name="trash-outline"
          size={28}
          iconSize={16}
          iconColor={withAlpha(colors.paper, textOpacity.secondary)}
          onPress={onDelete}
        />
      )}
      {!isMine && onReport && (
        <IconButton
          testID="comment-report"
          name="flag-outline"
          size={28}
          iconSize={16}
          iconColor={withAlpha(colors.paper, textOpacity.tertiary)}
          onPress={onReport}
          accessibilityLabel={t('reports.reportCommentA11y')}
        />
      )}
    </Row>
  );
}

const styles = StyleSheet.create({
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
