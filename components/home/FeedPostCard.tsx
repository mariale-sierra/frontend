import { memo, useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { IconButton } from '../ui/iconButton';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { CommentsSheet } from './CommentsSheet';
import { PostOptionsSheet } from './PostOptionsSheet';
import { ReportReasonSheet } from '../reports/ReportReasonSheet';
import { ConfirmationPopup } from '../ui/confirmationPopup';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import {
  deleteWorkoutPost,
  reactToPost,
  unreactToPost,
} from '../../services/workout-posts/workout-posts.service';
import { useAuth } from '../../hooks/useAuth';
import type { FeedPostViewModel } from '../../services/adapters/feedAdapter';

// Slightly longer than BottomSheetModal's 260ms close animation.
const SHEET_SWAP_DELAY_MS = 320;

interface FeedPostCardProps {
  post: FeedPostViewModel;
  /** Called after the viewer deleted their own post (B4), so the list can
   * drop it. Must be a stable callback to keep `memo` effective. */
  onDeleted?: (postId: string) => void;
}

// `memo`: its only prop is `post`, which keeps a stable reference in
// app/(tabs)/index.tsx's `feedPosts` state unless the underlying data
// actually changes — so a re-render triggered by an unrelated section of
// the Home screen (friend streaks resolving, the header re-rendering) no
// longer has to re-render every already-visible feed card too.
export const FeedPostCard = memo(function FeedPostCard({ post, onDeleted }: FeedPostCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { userId } = useAuth();
  // Real, reported bug: the "Message" action showed on your own posts too —
  // tapping it tried to open a conversation with yourself, which the chats
  // module doesn't support (getOrCreateConversation rejects a self-id).
  const isOwnPost = post.userId === userId;

  // Local, optimistic copies of the server-seeded reaction/comment state —
  // `post` itself never changes after the initial feed fetch (Home doesn't
  // re-fetch on every interaction), so this card owns its own count/liked
  // state after the first render, same as any other optimistic-update UI in
  // this app.
  const [liked, setLiked] = useState(post.likedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const reportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // A ref, not state, for the in-flight guard below — two taps fired back to
  // back (before React has committed a re-render) would both read the same
  // stale `false` from a state variable's closure, letting both through.
  // `useRef` updates are visible immediately, synchronously, so the second
  // tap's check always sees the first tap's write.
  const reactingRef = useRef(false);

  // Fixed 2026-08-31, real bug — was `router.push(\`/messaging/${post.userId}\`)`,
  // treating the OTHER user's id as if it were a conversationId (the
  // comment here used to explain this was a deliberate placeholder before
  // the real chats module existed — it now does, so this is the actual
  // swap that comment called for). `/messaging/new` resolves-or-creates the
  // real 1:1 conversation for `recipientUserId` and hands off to the real
  // thread screen — see app/messaging/new.tsx's own doc comment.
  // The report sheet opens only after the options sheet has finished
  // sliding out. Both are native <Modal>s, and iOS drops a modal presented
  // while another one is still dismissing.
  function handleReportFromOptions() {
    setOptionsVisible(false);
    reportTimerRef.current = setTimeout(() => setReportVisible(true), SHEET_SWAP_DELAY_MS);
  }

  // Same native-modal swap delay as Report above, for the delete confirmation.
  function handleDeleteFromOptions() {
    setOptionsVisible(false);
    reportTimerRef.current = setTimeout(() => setDeleteConfirmVisible(true), SHEET_SWAP_DELAY_MS);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteWorkoutPost(post.id);
      setDeleteConfirmVisible(false);
      onDeleted?.(post.id);
    } catch {
      // Global axios interceptor already shows the error toast.
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => () => {
    if (reportTimerRef.current) clearTimeout(reportTimerRef.current);
  }, []);

  function handleSendMessage() {
    router.push({ pathname: '/messaging/new', params: { recipientUserId: post.userId } });
  }

  // `/profile/[userId]` itself redirects to the tabs' own profile screen
  // when the id is the viewer's own — no isOwnPost branch needed here.
  function handleOpenAuthorProfile() {
    router.push(`/profile/${post.userId}`);
  }

  // Optimistic toggle, reverted on failure — the global axios interceptor
  // already surfaces an error toast, so the catch here only has to restore
  // the pre-tap state. `reactingRef` guards against a double-tap firing two
  // in-flight requests for opposite actions before the first resolves.
  async function handleToggleReaction() {
    if (reactingRef.current) return;
    reactingRef.current = true;
    const wasLiked = liked;
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
      reactingRef.current = false;
    }
  }

  return (
    <View style={styles.card}>
      <Row justify="space-between" align="center">
        <Row
          pressable
          onPress={handleOpenAuthorProfile}
          gap="sm"
          style={styles.header}
          accessibilityRole="button"
          accessibilityLabel={t('home.openAuthorProfileA11y', { name: post.userName })}
        >
          <UserAvatar username={post.userName} imageUrl={post.userAvatarUrl} size={32} />
          <View>
            <Text variant="label">{post.userName}</Text>
            <Text variant="caption" tone="secondary">{post.postedAt}</Text>
          </View>
        </Row>

        {/* Someone else's post: Report. Your own post: Delete (B4). */}
        <IconButton
          name="ellipsis-horizontal"
          size={32}
          iconSize={20}
          iconColor={colors.paper}
          onPress={() => setOptionsVisible(true)}
          accessibilityLabel={t('home.postOptions.openA11y')}
          hitSlop={10}
          testID="post-options"
        />
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

      <Row justify="space-between" align="center" style={styles.actions}>
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

        {isOwnPost ? null : (
          <Row pressable onPress={handleSendMessage} gap="xs">
            <Icon name="paper-plane-outline" size={20} color={colors.paper} />
            <Text variant="caption" tone="secondary">{t('home.sendMessage')}</Text>
          </Row>
        )}
      </Row>

      <CommentsSheet
        visible={commentsVisible}
        postId={post.id}
        onClose={() => setCommentsVisible(false)}
        onCommentsCountChange={setCommentsCount}
      />

      <PostOptionsSheet
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        onReport={isOwnPost ? undefined : handleReportFromOptions}
        onDelete={isOwnPost ? handleDeleteFromOptions : undefined}
      />

      <ConfirmationPopup
        visible={deleteConfirmVisible}
        title={t('home.postOptions.deleteConfirmTitle')}
        description={t('home.postOptions.deleteConfirmDescription')}
        icon="trash-outline"
        iconColor={colors.error}
        primaryButton={{
          label: t('home.postOptions.deleteConfirmCta'),
          onPress: confirmDelete,
          variant: 'danger',
          loading: deleting,
        }}
        secondaryButton={{
          label: t('home.postOptions.cancelCta'),
          onPress: () => setDeleteConfirmVisible(false),
          variant: 'neutral',
          disabled: deleting,
        }}
        onDismiss={() => !deleting && setDeleteConfirmVisible(false)}
      />

      <ReportReasonSheet
        visible={reportVisible}
        targetType="post"
        targetId={post.id}
        onClose={() => setReportVisible(false)}
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
  // The like / comment / send row sits well below the photo and the caption: on top
  // of the card's own `sm` gap, another `md`.
  actions: {
    marginTop: spacing.md,
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
