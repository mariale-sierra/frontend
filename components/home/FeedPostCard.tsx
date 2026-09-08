import { memo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { CommentsSheet } from './CommentsSheet';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { reactToPost, unreactToPost } from '../../services/workout-posts/workout-posts.service';
import type { FeedPostViewModel } from '../../services/adapters/feedAdapter';

interface FeedPostCardProps {
  post: FeedPostViewModel;
}

// `memo`: its only prop is `post`, which keeps a stable reference in
// app/(tabs)/index.tsx's `feedPosts` state unless the underlying data
// actually changes — so a re-render triggered by an unrelated section of
// the Home screen (friend streaks resolving, the header re-rendering) no
// longer has to re-render every already-visible feed card too.
export const FeedPostCard = memo(function FeedPostCard({ post }: FeedPostCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

  // Local, optimistic copies of the server-seeded reaction/comment state —
  // `post` itself never changes after the initial feed fetch (Home doesn't
  // re-fetch on every interaction), so this card owns its own count/liked
  // state after the first render, same as any other optimistic-update UI in
  // this app.
  const [liked, setLiked] = useState(post.likedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [reacting, setReacting] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);

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

  // Optimistic toggle, reverted on failure — the global axios interceptor
  // already surfaces an error toast, so the catch here only has to restore
  // the pre-tap state. `reacting` guards against a double-tap firing two
  // in-flight requests for opposite actions before the first resolves.
  async function handleToggleReaction() {
    if (reacting) return;
    const wasLiked = liked;
    setReacting(true);
    setLiked(!wasLiked);
    setLikesCount((count) => count + (wasLiked ? -1 : 1));
    try {
      if (wasLiked) {
        await unreactToPost(post.id);
      } else {
        await reactToPost(post.id);
      }
    } catch {
      setLiked(wasLiked);
      setLikesCount((count) => count + (wasLiked ? 1 : -1));
    } finally {
      setReacting(false);
    }
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
        <Row gap="lg" justify="flex-start">
          <Row
            pressable
            onPress={handleToggleReaction}
            gap="xs"
            accessibilityRole="button"
            accessibilityLabel={t('home.reactionA11y')}
          >
            <Icon name="heart-outline" size={20} color={liked ? colors.accent : colors.paper} />
            <Text variant="caption">{likesCount}</Text>
          </Row>

          <Row
            pressable
            onPress={() => setCommentsVisible(true)}
            gap="xs"
            accessibilityRole="button"
            accessibilityLabel={t('home.commentsA11y')}
          >
            <Icon name="chatbubble-outline" size={20} color={colors.paper} />
            <Text variant="caption">{commentsCount}</Text>
          </Row>
        </Row>

        <Row pressable onPress={handleSendMessage} gap="xs">
          <Icon name="paper-plane-outline" size={20} color={colors.paper} />
          <Text variant="caption" tone="secondary">{t('home.sendMessage')}</Text>
        </Row>
      </Row>

      <CommentsSheet
        visible={commentsVisible}
        postId={post.id}
        onClose={() => setCommentsVisible(false)}
        onCommentsCountChange={setCommentsCount}
      />
    </View>
  );
});

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
