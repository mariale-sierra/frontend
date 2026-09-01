import { Image, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import type { FeedPostViewModel } from '../../services/adapters/feedAdapter';

interface FeedPostCardProps {
  post: FeedPostViewModel;
}

export function FeedPostCard({ post }: FeedPostCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

  // Fixed 2026-08-31, real bug — was `router.push(\`/messaging/${post.userId}\`)`,
  // treating the OTHER user's id as if it were a conversationId (the
  // comment here used to explain this was a deliberate placeholder before
  // the real chats module existed — it now does, so this is the actual
  // swap that comment called for). `/messaging/new` resolves-or-creates the
  // real 1:1 conversation for `recipientUserId` and hands off to the real
  // thread screen — see app/messaging/new.tsx's own doc comment.
  function handleSendMessage() {
    router.push({ pathname: '/messaging/new', params: { recipientUserId: post.userId } });
  }

  return (
    <View style={styles.card}>
      <Row gap="sm" style={styles.header}>
        <UserAvatar username={post.userName} imageUrl={post.userAvatarUrl} size={32} />
        <View>
          <Text variant="label">{post.userName}</Text>
          <Text variant="caption" tone="secondary">{post.postedAt}</Text>
        </View>
      </Row>

      <View style={styles.photo}>
        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <Icon name="image-outline" size={42} color={withAlpha(colors.paper, textOpacity.tertiary)} />
        )}
      </View>

      {post.caption ? (
        <Text variant="body" numberOfLines={2}>
          {post.caption}
        </Text>
      ) : null}

      <Row justify="space-between" align="center">
        <Row gap="xs">
          <Icon name="heart-outline" size={20} color={colors.paper} />
          <Text variant="caption">{post.likesCount}</Text>
        </Row>

        <Row pressable onPress={handleSendMessage} gap="xs">
          <Icon name="chatbubble-outline" size={20} color={colors.paper} />
          <Text variant="caption" tone="secondary">{t('home.sendMessage')}</Text>
        </Row>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    justifyContent: 'flex-start',
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.medium,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
