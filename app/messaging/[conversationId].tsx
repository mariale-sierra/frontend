import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { safeBack } from '../../utils/navigation';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { IconButton } from '../../components/ui/iconButton';
import { UserAvatar } from '../../components/ui/userAvatar';
import { ConfirmationPopup } from '../../components/ui/confirmationPopup';
import { Row } from '../../components/layout/row';
import { MessageBubble } from '../../components/chats/MessageBubble';
import { useConversationMessages } from '../../hooks/useConversationMessages';
import { useScrollToLatestMessage } from '../../hooks/useScrollToLatestMessage';
import { useAuth } from '../../hooks/useAuth';
import { acceptConversationRequest, declineConversationRequest } from '../../services/chats/chats.service';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { getDaySeparator, isDifferentDay } from '../../utils/time';

const HEADER_AVATAR_SIZE = 40;
// Shrunk from 48, per explicit "row is too tall" request — happens to land
// on the same 40 as the header avatar above, but that's coincidental, not
// shared meaning, so it gets its own constant rather than reusing that one.
const SEND_BUTTON_SIZE = 40;

export default function Chat() {
  const { t } = useTranslation();
  const router = useRouter();
  const { userId } = useAuth();
  const params = useLocalSearchParams<{
    conversationId: string;
    otherUserId?: string | string[];
    otherUsername?: string | string[];
    otherDisplayName?: string | string[];
    otherProfileImageUrl?: string | string[];
    isPending?: string | string[];
  }>();
  const { conversationId } = params;
  // expo-router params can come back as string[] — same unwrap
  // `app/profile/[userId].tsx` already does — before this got applied here
  // too, a bad shape meant the ⋯ menu could forward a mangled id to Chat
  // details → "View profile", which the backend then rejected as an
  // invalid UUID ("Validation failed" toast). Real, reported bug.
  const unwrap = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const otherUserId = unwrap(params.otherUserId);
  const otherUsername = unwrap(params.otherUsername);
  const otherDisplayName = unwrap(params.otherDisplayName);
  const otherProfileImageUrl = unwrap(params.otherProfileImageUrl);

  // Message requests (Instagram-style) — 1:1 conversations only; spaces have
  // their own separate join-request system (Chats-47E). Seeded from the
  // route param (the list row already knows this from its own fetch) and
  // then owned locally — accepting/declining doesn't need a full conversation
  // refetch just to flip one flag.
  const [isPending, setIsPending] = useState(unwrap(params.isPending) === '1');
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [declineConfirmVisible, setDeclineConfirmVisible] = useState(false);
  const [requestActionError, setRequestActionError] = useState<string | null>(null);

  const {
    messages,
    loading,
    error,
    sending,
    hasMore,
    loadingOlder,
    loadOlder,
    send,
    reload,
  } = useConversationMessages(conversationId);

  const [draft, setDraft] = useState('');
  const { listRef, ready, onContentSizeChange, onLayout } = useScrollToLatestMessage(messages);

  const name = otherDisplayName || (otherUsername ? `@${otherUsername}` : '');
  const otherAvatar = { username: otherUsername ?? '', imageUrl: otherProfileImageUrl || null };

  const handleSend = useCallback(async () => {
    if (!draft.trim()) return;
    const toSend = draft;
    setDraft('');
    await send(toSend);
  }, [draft, send]);

  async function handleAccept() {
    setAccepting(true);
    setRequestActionError(null);
    try {
      await acceptConversationRequest(conversationId);
      setIsPending(false);
    } catch {
      setRequestActionError(t('chats.acceptError'));
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    setDeclining(true);
    setRequestActionError(null);
    try {
      await declineConversationRequest(conversationId);
      setDeclineConfirmVisible(false);
      safeBack('/(tabs)');
    } catch {
      setRequestActionError(t('chats.declineError'));
      setDeclining(false);
    }
  }

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
        <Row align="center" gap="sm" style={styles.headerInfo} justify="flex-start">
          <UserAvatar username={otherUsername ?? ''} imageUrl={otherProfileImageUrl || null} size={HEADER_AVATAR_SIZE} />
          <Text variant="body" weight="bold" numberOfLines={1} style={styles.headerName}>
            {name}
          </Text>
        </Row>
        {/* Chats-47A's header also shows an "Active now" presence indicator
            next to the name — no online/presence data exists anywhere in
            the backend (chats or otherwise), so it's left out rather than
            faked as always-on or always-off. */}
        <IconButton
          name="ellipsis-horizontal"
          size={44}
          iconSize={20}
          iconColor={colors.paper}
          onPress={() =>
            router.push({
              pathname: '/messaging/chat-details',
              params: { otherUserId: otherUserId ?? '', otherUsername: otherUsername ?? '', otherDisplayName: otherDisplayName ?? '', otherProfileImageUrl: otherProfileImageUrl ?? '' },
            })
          }
          accessibilityLabel={t('chats.optionsA11y')}
        />
      </View>

      {loading ? (
        // A chat thread's real shape (message count, bubble widths, mixed
        // sides, day separators) is genuinely unpredictable — a skeleton
        // here would just be fake bubbles that don't resemble what's about
        // to load and would visibly jump/reflow once it does. A spinner is
        // the honest signal for content whose shape can't be previewed,
        // same as this app's error/empty states elsewhere.
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text tone="secondary">{t('chats.threadLoadError')}</Text>
          <Button variant="outline" size="sm" onPress={reload}>
            {t('common.actions.continue')}
          </Button>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          // Real, reported bug, twice over: a flat hardcoded 90 (pre-existing,
          // from before this session's redesign) left a large gap above the
          // keyboard. The fix wasn't a bigger/smarter offset, though — on
          // iOS, `padding` behavior already measures this view's own actual
          // on-screen position (via `measureInWindow`), which already
          // accounts for everything rendered above it (the header, the
          // safe-area inset). Adding `insets.top + headerHeight` on top of
          // that (the previous attempt here) double-counted the same space
          // RN was already compensating for automatically — an even bigger
          // gap, not a smaller one. `keyboardVerticalOffset` is only meant
          // for space the automatic measurement CAN'T see (e.g. a
          // translucent bar outside the view tree) — this screen has none,
          // so 0 is correct.
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            // Hidden until scrolled to the latest message — see
            // useScrollToLatestMessage's own doc comment: without this, the
            // thread visibly flashes its TOP for a frame before jumping to
            // the bottom.
            style={{ opacity: ready ? 1 : 0 }}
            onContentSizeChange={onContentSizeChange}
            onLayout={onLayout}
            renderItem={({ item, index }) => {
              const previous = messages[index - 1];
              const showDaySeparator = !previous || isDifferentDay(previous.sentAt, item.sentAt);
              const isMine = item.senderId === userId;
              return (
                <>
                  {showDaySeparator && <DaySeparator iso={item.sentAt} t={t} />}
                  <MessageBubble message={item} isMine={isMine} otherAvatar={isMine ? undefined : otherAvatar} />
                </>
              );
            }}
            ListHeaderComponent={
              hasMore ? (
                <Button
                  variant="outline"
                  size="sm"
                  loading={loadingOlder}
                  onPress={loadOlder}
                  style={styles.loadOlderButton}
                >
                  {t('chats.loadOlderMessages')}
                </Button>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Text tone="secondary">{t('chats.noMessagesYet')}</Text>
              </View>
            }
          />

          {isPending ? (
            // Message request (Instagram-style) — the composer is replaced
            // entirely until accepted; the recipient can read but not reply.
            <View style={styles.requestBar}>
              <Text variant="body" tone="secondary" align="center" style={styles.requestNotice}>
                {t('chats.messageRequestNotice', { name })}
              </Text>
              {requestActionError ? (
                <Text variant="caption" style={styles.requestError}>
                  {requestActionError}
                </Text>
              ) : null}
              <Row gap="sm" align="center" justify="flex-start">
                {/* `dangerSubtle` — a translucent `error`-tinted wash with
                    an `error`-colored (not neutral `paper`) border, softer
                    than solid `danger` but with real visible color/weight —
                    a plain `surface` fill with no border read as too flat
                    next to Accept's solid `primary` pill (also tried, also
                    rejected). */}
                <Button
                  variant="dangerSubtle"
                  style={styles.requestButton}
                  loading={declining}
                  disabled={accepting}
                  onPress={() => setDeclineConfirmVisible(true)}
                >
                  {t('chats.declineCta')}
                </Button>
                <Button
                  style={styles.requestButton}
                  loading={accepting}
                  disabled={declining}
                  onPress={handleAccept}
                >
                  {t('chats.acceptCta')}
                </Button>
              </Row>
            </View>
          ) : (
            <View style={styles.inputBar}>
              {/* `justify="flex-start"` + wrapping `Input` in its own
                  `flex:1` View — `Row` defaults to `space-between`, and
                  `Input`'s OWN outer wrapper (its `containerStyle` prop only
                  reaches the inner pill, not that wrapper) has no flex of its
                  own, so with nothing forcing it to grow it collapsed to the
                  width of an empty `TextInput` — a real, reported "the input
                  is tiny/doesn't work" bug, not a cosmetic one. */}
              <Row align="center" gap="sm" justify="flex-start">
                <View style={styles.inputWrapper}>
                  <Input
                    containerStyle={styles.input}
                    style={styles.inputText}
                    placeholderVariant="caption"
                    placeholder={t('chats.messagePlaceholder', { name })}
                    value={draft}
                    onChangeText={setDraft}
                    multiline
                    maxLength={2000}
                    showCounter={false}
                  />
                </View>
                <IconButton
                  name="send"
                  size={SEND_BUTTON_SIZE}
                  iconSize={18}
                  iconColor={colors.ink}
                  style={[styles.sendButton, (sending || !draft.trim()) && styles.sendButtonDisabled]}
                  onPress={handleSend}
                  disabled={sending || !draft.trim()}
                />
              </Row>
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      <ConfirmationPopup
        visible={declineConfirmVisible}
        title={t('chats.declineConfirmTitle')}
        description={t('chats.declineConfirmMessage')}
        icon="trash-outline"
        iconColor={colors.error}
        primaryButton={{
          label: t('chats.declineCta'),
          onPress: handleDecline,
          variant: 'danger',
          loading: declining,
        }}
        secondaryButton={{
          label: t('chats.cancelCta'),
          onPress: () => setDeclineConfirmVisible(false),
          variant: 'neutral',
          disabled: declining,
        }}
        onDismiss={() => setDeclineConfirmVisible(false)}
      />
    </ScreenBackground>
  );
}

/**
 * Chats-47A's centered "TODAY" pill above the first message of each
 * calendar day — `Text`'s own `header` variant (bold, uppercase, small
 * DM Sans) already matches the wireframe's pill typography exactly, so
 * this only adds the pill container around it.
 */
function DaySeparator({ iso, t }: { iso: string; t: (key: string) => string }) {
  const separator = getDaySeparator(iso);
  const label =
    separator.kind === 'today' ? t('chats.today') : separator.kind === 'yesterday' ? t('chats.yesterday') : separator.label;

  return (
    <View style={styles.daySeparatorWrap}>
      <View style={styles.daySeparatorPill}>
        <Text variant="header" tone="secondary">
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    flexShrink: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexGrow: 1,
  },
  loadOlderButton: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  inputBar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
    paddingHorizontal: spacing.lg,
    // Tightened from sm/md, per explicit "row is too tall" request.
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  // Message request (Instagram-style) — replaces inputBar entirely while
  // `isPending`, same surface/border chrome so the footer reads as one
  // consistent "bottom bar" family either way.
  requestBar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
    gap: spacing.sm,
  },
  requestNotice: {
    paddingHorizontal: spacing.sm,
  },
  requestError: {
    color: colors.error,
    textAlign: 'center',
  },
  requestButton: {
    flex: 1,
  },
  inputWrapper: {
    flex: 1,
  },
  // Input's own base TextInput style zeroes `paddingVertical` and sets
  // `includeFontPadding: false` (Android) — without any padding to
  // compensate, the placeholder/typed text visually anchors to the very
  // top of the pill instead of centering. Real, reported bug — this
  // `style` prop reaches the TextInput itself (last in Input's own style
  // array, so it wins over that zeroed base).
  inputText: {
    // Asymmetric on purpose: the top-anchoring bug (see comment above) only
    // needs to be countered from the TOP, so more `paddingTop` than
    // `paddingBottom` recenters the text with less total added height than
    // bumping `paddingVertical` symmetrically would — the previous
    // symmetric `spacing.xs` wasn't enough top offset after the row got
    // tightened, but going back to symmetric `spacing.sm` would undo that
    // tightening.
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    // A small nudge off the pill's edge — Input's own base container
    // already insets it via `paddingHorizontal: spacing.md`; this stacks
    // `spacing.xs` (the scale's smallest step) on top for a touch more
    // breathing room, rather than a raw pixel value.
    paddingLeft: spacing.xs,
  },
  input: {
    backgroundColor: colors.ink,
    borderRadius: radius.big,
    // Tightened from Input's own default `spacing.md`, per explicit "row is
    // too tall" request — paired with the smaller `sendButton` below so the
    // pill and the button land on close to the same height.
    paddingVertical: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.paper,
    borderRadius: radius.big,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  daySeparatorWrap: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  daySeparatorPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.big,
    backgroundColor: colors.surface,
  },
});
