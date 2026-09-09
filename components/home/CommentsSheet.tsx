import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheetModal } from '../ui/bottomSheetModal';
import { ConfirmationPopup } from '../ui/confirmationPopup';
import { Icon } from '../ui/icon';
import { IconButton } from '../ui/iconButton';
import { Input } from '../ui/input';
import { Text } from '../ui/text';
import { Row } from '../layout/row';
import { CommentRow } from './CommentRow';
import { colors, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { useAuth } from '../../hooks/useAuth';
import {
  createComment,
  deleteComment,
  listComments,
} from '../../services/workout-posts/workout-posts.service';
import {
  toCommentViewModel,
  toCommentViewModels,
} from '../../services/adapters/workoutPostSocialAdapter';
import type { CommentViewModel } from '../../services/adapters/workoutPostSocialAdapter';

interface CommentsSheetProps {
  visible: boolean;
  postId: string;
  onClose: () => void;
  /** Lets the opening FeedPostCard keep its own comment-count badge in sync
   * without re-fetching the whole feed. */
  onCommentsCountChange: (count: number) => void;
}

const SEND_BUTTON_SIZE = 40;

/**
 * Comments list + composer for one workout post, opened from FeedPostCard's
 * comment icon. Own list (not FlatList's `ListHeaderComponent`) since the
 * loading/error/empty states each need to fully replace the body, same
 * three-way branch FeedErrorState/EmptyFeed already establish for the feed
 * itself — just reused inline here instead of as separate components, since
 * neither is shared outside its own screen either.
 */
export function CommentsSheet({
  visible,
  postId,
  onClose,
  onCommentsCountChange,
}: CommentsSheetProps) {
  const { t } = useTranslation();
  const { userId } = useAuth();

  const [comments, setComments] = useState<CommentViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nextAfter, setNextAfter] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    listComments(postId)
      .then(({ comments: page, nextAfter: next }) => {
        setComments(toCommentViewModels(page));
        setNextAfter(next);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  function loadMore() {
    if (loadingMore || nextAfter === null) return;
    setLoadingMore(true);
    listComments(postId, nextAfter)
      .then(({ comments: page, nextAfter: next }) => {
        setComments((prev) => [...prev, ...toCommentViewModels(page)]);
        setNextAfter(next);
      })
      .catch(() => {
        // Global axios interceptor already surfaced a toast — pagination
        // simply stops here, the already-loaded comments stay visible.
      })
      .finally(() => setLoadingMore(false));
  }

  async function handleSend() {
    const content = draft.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    try {
      const created = await createComment(postId, content);
      setComments((prev) => {
        const next = [...prev, toCommentViewModel(created)];
        onCommentsCountChange(next.length);
        return next;
      });
      setDraft('');
    } catch {
      // Global axios interceptor already shows the error toast.
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (pendingDeleteId === null) return;
    const id = pendingDeleteId;
    setDeleting(true);
    try {
      await deleteComment(postId, id);
      setComments((prev) => {
        const next = prev.filter((c) => c.id !== id);
        onCommentsCountChange(next.length);
        return next;
      });
      setPendingDeleteId(null);
    } catch {
      // Global axios interceptor already shows the error toast.
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* BottomSheetModal itself tracks the keyboard and floats the whole
          sheet up above it (see its own doc comment) — a KeyboardAvoidingView
          in here doesn't work reliably nested inside a Modal, and would
          double up with that anyway. */}
      <BottomSheetModal visible={visible} onClose={onClose} height="50%">
        <View style={styles.flexFill}>
          <Row justify="space-between" style={styles.header}>
            <Text variant="subheader">{t('comments.title')}</Text>
            <IconButton name="close-outline" onPress={onClose} />
          </Row>

          {loading ? (
            <View style={[styles.centered, styles.flexFill]}>
              <ActivityIndicator color={colors.paper} />
            </View>
          ) : error ? (
            <View style={[styles.centered, styles.flexFill]}>
              <Icon name="cloud-offline-outline" size={34} color={withAlpha(colors.paper, textOpacity.tertiary)} />
              <Text variant="body" tone="secondary" align="center">
                {t('comments.errorMessage')}
              </Text>
            </View>
          ) : comments.length === 0 ? (
            <View style={[styles.centered, styles.flexFill]}>
              <Icon name="chatbubble-outline" size={34} color={withAlpha(colors.paper, textOpacity.tertiary)} />
              <Text variant="body" tone="secondary" align="center">
                {t('comments.emptyMessage')}
              </Text>
            </View>
          ) : (
            <FlatList
              style={styles.flexFill}
              data={comments}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <CommentRow
                  comment={item}
                  isMine={item.authorId === userId}
                  onDelete={() => setPendingDeleteId(item.id)}
                />
              )}
              ItemSeparatorComponent={ItemSeparator}
              onEndReached={loadMore}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                loadingMore ? <ActivityIndicator color={colors.paper} style={styles.footerLoader} /> : null
              }
            />
          )}

          <Row align="center" gap="sm" justify="flex-start" style={styles.composer}>
            <View style={styles.inputWrapper}>
              <Input
                containerStyle={styles.inputContainer}
                placeholder={t('comments.placeholder')}
                placeholderVariant="caption"
                value={draft}
                onChangeText={setDraft}
                maxLength={500}
                showCounter={false}
              />
            </View>
            <IconButton
              name="send-outline"
              size={SEND_BUTTON_SIZE}
              iconSize={18}
              iconColor={colors.ink}
              style={[styles.sendButton, (submitting || !draft.trim()) && styles.sendButtonDisabled]}
              // Real, reported bug: tapping Send while the keyboard was open
              // just closed the keyboard — sending itself needed a second,
              // separate tap. This sheet renders inside a `Modal` (a
              // separate native window/Dialog on Android), and the first
              // touch outside the focused input gets consumed there to
              // dismiss the keyboard without also delivering as a click to
              // the button underneath — a Modal-specific quirk the 1:1 chat
              // screen doesn't hit (it's a normal full-screen route, not a
              // Modal). `onPressIn` fires the moment the touch starts,
              // before that ambiguity plays out, so the same tap that closes
              // the keyboard also sends.
              onPressIn={handleSend}
              disabled={submitting || !draft.trim()}
            />
          </Row>
        </View>
      </BottomSheetModal>

      <ConfirmationPopup
        visible={pendingDeleteId !== null}
        title={t('comments.deleteConfirmTitle')}
        icon="trash-outline"
        iconColor={colors.error}
        primaryButton={{
          label: t('comments.deleteConfirmCta'),
          onPress: handleDelete,
          variant: 'danger',
          loading: deleting,
        }}
        secondaryButton={{
          label: t('comments.cancelCta'),
          onPress: () => setPendingDeleteId(null),
          variant: 'neutral',
          disabled: deleting,
        }}
        onDismiss={() => setPendingDeleteId(null)}
      />
    </>
  );
}

function ItemSeparator() {
  return <View style={{ height: spacing.md }} />;
}

const styles = StyleSheet.create({
  flexFill: {
    flex: 1,
  },
  header: {
    marginBottom: spacing.md,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  footerLoader: {
    marginVertical: spacing.md,
  },
  composer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, textOpacity.tertiary),
  },
  inputWrapper: {
    flex: 1,
  },
  inputContainer: {
    backgroundColor: colors.surface,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: SEND_BUTTON_SIZE / 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
