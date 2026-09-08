import { StyleSheet, View } from 'react-native';
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
}

/** One comment row in CommentsSheet — avatar + name/timestamp + body, with a
 * trailing delete action only rendered for the viewer's own comment. */
export function CommentRow({ comment, isMine, onDelete }: CommentRowProps) {
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
          name="trash-outline"
          size={28}
          iconSize={16}
          iconColor={withAlpha(colors.paper, textOpacity.secondary)}
          onPress={onDelete}
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
